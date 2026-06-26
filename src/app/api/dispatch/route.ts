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

  // Railway sirve detrás de un proxy: req.url tiene `0.0.0.0:8080` (host
  // interno del container). Usamos x-forwarded-host / x-forwarded-proto que
  // el edge inyecta con los valores reales antes de llegar al server.
  const hdrHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const hdrProto = req.headers.get("x-forwarded-proto") ?? "https";
  const publicOrigin = `${hdrProto}://${hdrHost}`;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nexclub.app";

  if (!userId) {
    return NextResponse.redirect(`${publicOrigin}/sign-in`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true, clubId: true, club: { select: { slug: true } } },
  });

  if (!user) {
    return NextResponse.redirect(`${publicOrigin}/sign-in?reason=account_pending`);
  }

  // SUPERADMIN tiene panel propio en root.
  if (user.role === "SUPERADMIN") {
    return NextResponse.redirect(`${publicOrigin}/super`);
  }

  const panel = ROLE_TO_PATH[user.role];
  if (!panel || !user.club?.slug) {
    return NextResponse.redirect(`${publicOrigin}/sign-in?reason=no_club`);
  }

  // En localhost (dev), nos mantenemos en el mismo host con el path del panel.
  const isLocal = hdrHost.startsWith("localhost") || hdrHost.startsWith("127.") || hdrHost === "0.0.0.0";
  if (isLocal) {
    return NextResponse.redirect(`${publicOrigin}${panel}`);
  }

  // En prod, si ya estamos en el subdomain correcto del club no cambiamos
  // de host — sólo ajustamos el path. Si estamos en root, saltamos al subdomain.
  const targetHost = `${user.club.slug}.${rootDomain}`;
  if (hdrHost === targetHost) {
    return NextResponse.redirect(`${publicOrigin}${panel}`);
  }
  return NextResponse.redirect(`${hdrProto}://${targetHost}${panel}`);
}
