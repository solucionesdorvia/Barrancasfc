import { NextResponse } from "next/server";

/**
 * Healthcheck que no toca Postgres ni Clerk. Sirve para que Railway pueda
 * validar que el proceso Next.js está vivo aunque la DB esté caída.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "barrancas-fc",
    ts: Date.now(),
  });
}
