import { prisma } from "@/lib/prisma";

/**
 * Verifica que el `playerId` pertenezca al club del usuario.
 * Preparado para multi-club aunque hoy es single-tenant.
 */
export async function assertPlayerInClub(playerId: string, clubId: string): Promise<{ ok: true } | { ok: false; reason: "not_found" | "wrong_club" }> {
  const p = await prisma.player.findUnique({
    where: { id: playerId },
    select: { id: true, clubId: true },
  });
  if (!p) return { ok: false, reason: "not_found" };
  if (p.clubId !== clubId) return { ok: false, reason: "wrong_club" };
  return { ok: true };
}

export async function assertPaymentInClub(paymentId: string, clubId: string): Promise<{ ok: true } | { ok: false; reason: "not_found" | "wrong_club" }> {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, player: { select: { clubId: true } } },
  });
  if (!p) return { ok: false, reason: "not_found" };
  if (p.player.clubId !== clubId) return { ok: false, reason: "wrong_club" };
  return { ok: true };
}
