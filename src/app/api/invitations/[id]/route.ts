import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * Revocar una invitación (no la borra para mantener el rastro). Una vez revocada
 * no se puede aceptar más, incluso si todavía no expiró.
 */
export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const invitation = await prisma.invitation.findUnique({ where: { id: params.id } });
  if (!invitation) return apiNotFound("Invitación no encontrada");

  await prisma.invitation.update({
    where: { id: params.id },
    data: { revoked: true },
  });

  await logAudit({
    userId: user.id,
    entityType: "Invitation",
    entityId: invitation.id,
    action: "INVITATION_REVOKED",
    changes: { role: invitation.role, email: invitation.email },
  });

  return apiOk({ ok: true });
});
