import { prisma } from "@/lib/prisma";

/**
 * Asigna un familyGroupId común a los jugadores que estén vinculados al mismo
 * padre, siempre que ninguno tenga ya un grupo asignado.
 *
 * - Si los players no son hermanos (1 solo) → no hace nada.
 * - Si alguno ya tiene familyGroupId → no toca a ninguno (respetamos lo manual).
 * - Si todos están sin grupo → les arma uno con ID `family-{userId}`.
 *
 * El % de descuento NO se setea automático — eso lo decide el admin después.
 * El grupo solo agrupa visualmente y deja la puerta abierta a aplicar
 * descuento sin reasignar uno por uno.
 *
 * No bloquea ni rompe el flow padre si falla — todo en try/catch.
 */
export async function autoAssignFamilyGroup(parentUserId: string, childrenIds: string[]) {
  if (childrenIds.length < 2) return { assigned: 0, reason: "single_child" as const };

  try {
    const children = await prisma.player.findMany({
      where: { id: { in: childrenIds } },
      select: { id: true, familyGroupId: true },
    });

    // Si alguno ya tiene grupo, no tocamos (el admin podría haberlo
    // asignado manualmente o por otra vía).
    if (children.some((c) => c.familyGroupId)) {
      return { assigned: 0, reason: "already_has_group" as const };
    }

    const groupId = `family-${parentUserId}`;
    const result = await prisma.player.updateMany({
      where: { id: { in: children.map((c) => c.id) } },
      data: { familyGroupId: groupId },
    });

    return { assigned: result.count, groupId, reason: "ok" as const };
  } catch (e) {
    console.error("[autoAssignFamilyGroup] failed:", e);
    return { assigned: 0, reason: "error" as const };
  }
}
