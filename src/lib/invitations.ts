import { prisma } from "@/lib/prisma";

export type InvitationLookup =
  | { ok: true; invitation: Awaited<ReturnType<typeof prisma.invitation.findUnique>> & object }
  | { ok: false; reason: "not_found" | "revoked" | "expired" | "used" };

/**
 * Busca una invitación por token y valida que sea utilizable.
 * Devuelve el motivo de fallo si no lo es, para mostrar mensajes claros.
 */
export async function lookupInvitation(token: string): Promise<InvitationLookup> {
  const invitation = await prisma.invitation.findUnique({ where: { token } }).catch(() => null);
  if (!invitation) return { ok: false, reason: "not_found" };
  if (invitation.revoked) return { ok: false, reason: "revoked" };
  if (invitation.usedAt) return { ok: false, reason: "used" };
  if (invitation.expiresAt < new Date()) return { ok: false, reason: "expired" };
  return { ok: true, invitation };
}

export const INVITATION_FAILURE_LABEL = {
  not_found: "Esta invitación no existe o el link es incorrecto.",
  revoked: "Esta invitación fue revocada por un administrador.",
  expired: "Esta invitación venció. Pedile al administrador que te genere una nueva.",
  used: "Esta invitación ya fue utilizada. Si sos el destinatario, ingresá con tu cuenta.",
} as const;
