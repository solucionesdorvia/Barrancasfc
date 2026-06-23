import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Dispatcher post-login: averigua a qué club pertenece el usuario y lo
 * redirige al subdomain + panel que le corresponde.
 *
 * Casos:
 * - SUPERADMIN → /super (cualquier host)
 * - ADMIN/PROFESOR/PADRE con club asignado → <slug>.nexclub.app/<panel>
 * - User en Clerk pero NO en DB → /sign-in (webhook todavía no sincronizó)
 * - Sin sesión → /sign-in
 *
 * Se usa desde:
 * 1. El botón "Ir al panel" del header de la landing.
 * 2. `forceRedirectUrl` del Clerk SignIn cuando se sirve desde el root.
 */
export const dynamic = "force-dynamic";

const ROLE_TO_PATH: Record<string, string> = {
  ADMIN: "/admin",
  PROFESOR: "/profesor",
  PADRE: "/padre",
};

export async function GET(req: Request) {
  const { userId } = auth();
  const url = new URL(req.url);
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nexclub.app";
  const proto = url.protocol;

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, clubId: true, club: { select: { slug: true } } },
  });

  if (!user) {
    // El user existe en Clerk pero no en DB. Lo más probable: webhook pendiente
    // o cuenta nueva sin asociar. Lo mandamos a sign-in con un hint.
    return NextResponse.redirect(new URL("/sign-in?reason=account_pending", req.url));
  }

  // SUPERADMIN tiene panel propio en root.
  if (user.role === "SUPERADMIN") {
    return NextResponse.redirect(new URL("/super", req.url));
  }

  const panel = ROLE_TO_PATH[user.role];
  if (!panel || !user.club?.slug) {
    // Role sin panel mapeado (no debería pasar) o user sin club asignado.
    return NextResponse.redirect(new URL("/sign-in?reason=no_club", req.url));
  }

  // Construimos URL al subdomain del club. En dev (localhost) saltamos el
  // subdomain switch y vamos al path directo — el middleware del root sirve.
  const isLocal = url.hostname === "localhost" || url.hostname.endsWith(".localhost");
  if (isLocal) {
    return NextResponse.redirect(new URL(panel, req.url));
  }

  const target = `${proto}//${user.club.slug}.${rootDomain}${panel}`;
  return NextResponse.redirect(target);
}
