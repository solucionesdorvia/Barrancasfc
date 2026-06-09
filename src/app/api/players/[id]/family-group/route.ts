import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { familyGroupSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * PATCH /api/players/[id]/family-group
 * Asigna (o limpia) el grupo familiar y el % de descuento de un jugador.
 * Solo admin.
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(familyGroupSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, firstName: true, lastName: true, familyGroupId: true, familyDiscountPercent: true },
  });
  if (!player) return apiNotFound("Jugador no encontrado");

  // Si se pasa familyGroupId vacío/null → limpiar
  const familyGroupId = parsed.data.familyGroupId?.trim() ? parsed.data.familyGroupId.trim() : null;
  const familyDiscountPercent = familyGroupId
    ? parsed.data.familyDiscountPercent ?? 0
    : null; // si no hay grupo, no hay descuento

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { familyGroupId, familyDiscountPercent },
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: player.id,
    action: "FAMILY_GROUP_UPDATED",
    changes: {
      from: { familyGroupId: player.familyGroupId, pct: player.familyDiscountPercent },
      to: { familyGroupId, pct: familyDiscountPercent },
      player: `${player.firstName} ${player.lastName}`,
    },
  });

  return apiOk(updated);
});
