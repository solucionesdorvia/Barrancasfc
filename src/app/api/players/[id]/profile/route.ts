import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { playerProfileUpdateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * Actualizar el perfil completo del jugador. Admin puede editar cualquier
 * jugador; padre solo los suyos; profesor no edita (solo lee).
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();

  // Cargar el jugador + relaciones para autorización
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, parents: { select: { id: true } } },
  });
  if (!player) return apiNotFound("Jugador no encontrado");

  // Autorización por rol
  if (user.role === "PROFESOR") return apiForbidden("Los profesores no pueden editar perfiles");
  if (user.role === "PADRE") {
    const isParent = player.parents.some((p) => p.id === user.id);
    if (!isParent) return apiForbidden("Solo podés editar el perfil de tus hijos");
  }

  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(playerProfileUpdateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  // Campos solo admin
  const adminOnly = ["clothingPaid", "transferStatus", "registeredIn2025", "lastInstallmentNote"] as const;
  const data: Record<string, unknown> = { ...parsed.data };
  if (user.role !== "ADMIN") {
    for (const f of adminOnly) delete data[f];
  }

  // Sanitizar: strings vacíos → null
  for (const k of Object.keys(data)) {
    if (data[k] === "") data[k] = null;
  }
  if (typeof data.birthDate === "string" && data.birthDate) {
    data.birthDate = new Date(data.birthDate);
  } else {
    delete data.birthDate;
  }

  const updated = await prisma.player.update({
    where: { id: params.id },
    data,
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: params.id,
    action: "PLAYER_UPDATED",
    changes: { fields: Object.keys(data), updatedBy: user.role },
  });

  return apiOk({ ok: true, player: { id: updated.id } });
});
