import { NextResponse } from "next/server";

/**
 * Endpoint para verificar que Sentry está capturando errores. Solo accesible
 * con `?secret=<SUPERADMIN_BOOTSTRAP_SECRET>` para que no lo descubra cualquiera.
 * Tirá un GET y debería aparecer el error en Sentry dentro de 30s.
 *
 *   curl https://www.nexclub.app/api/sentry-test?secret=...
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== process.env.SUPERADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  throw new Error("Sentry test error — disparo intencional desde /api/sentry-test");
}
