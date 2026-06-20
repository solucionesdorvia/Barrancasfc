import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  extractSubdomainFromHost,
  isRootHost,
  RAILWAY_LEGACY_HOSTS,
  ROOT_DOMAIN_ACTIVE,
} from "@/lib/club-edge";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/uploadthing(.*)",
  "/api/health(.*)",
  "/invite/(.*)",
  "/api/invitations/by-token/(.*)",
  // SEO / assets accesibles sin auth
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image(.*)",
  "/favicon.ico",
  "/legal/(.*)",
]);

/**
 * Rutas que solo tienen sentido en un subdomain de club. Si entran a estas
 * desde el root (`nexclub.app/admin`) las redirigimos al landing.
 */
const isClubOnly = createRouteMatcher([
  "/admin(.*)",
  "/profesor(.*)",
  "/padre(.*)",
  "/invite(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware((auth, req) => {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const cleanHost = host.split(":")[0];
  const pathname = req.nextUrl.pathname;

  // 1) Redirect 301 desde URL vieja de Railway → subdomain del nuevo dominio.
  //    Solo cuando el dominio NEXCLUB está activo (flag de env).
  if (ROOT_DOMAIN_ACTIVE && RAILWAY_LEGACY_HOSTS[cleanHost]) {
    const targetSlug = RAILWAY_LEGACY_HOSTS[cleanHost];
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nexclub.app";
    const newUrl = new URL(req.url);
    newUrl.host = `${targetSlug}.${rootDomain}`;
    newUrl.protocol = "https:";
    newUrl.port = "";
    return NextResponse.redirect(newUrl, 301);
  }

  // 2) Resolvemos si estamos en root o en subdomain de club.
  const subdomain = extractSubdomainFromHost(cleanHost);
  const isRoot = isRootHost(cleanHost);

  // 3) Hardening de rutas por zona:
  //    - Root: bloqueamos rutas que pertenecen al panel del club
  //    - Subdomain: bloqueamos rutas que pertenecen a NEXCLUB (super)
  //    Solo aplicamos si el host es claramente root o subdomain del root
  //    domain configurado. En localhost dev / Railway legacy NO aplicamos
  //    para no romper el flujo actual de testing.
  if (isRoot && isClubOnly(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // /super se sirve desde cualquier host. La seguridad va por role
  // (requireRole("SUPERADMIN") en el layout), no por host. Antes redirigíamos
  // subdomain → root pero generaba dependencia frágil del DNS apex.

  // 4) Auth: las rutas protegidas requieren login (sin cambios).
  if (!isPublic(req)) {
    auth().protect();
  }

  // 5) Inyectamos headers de contexto para que server components / layouts
  //    los lean sin reparsear:
  //    - x-pathname: la URL actual (mismo uso que antes)
  //    - x-club-slug: el slug del tenant si el host es un subdomain
  //    - x-host: el host crudo (sirve para getCurrentClub y debug)
  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  res.headers.set("x-host", cleanHost);
  if (subdomain) res.headers.set("x-club-slug", subdomain);
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
