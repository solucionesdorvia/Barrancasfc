import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { changePlayerStatusSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";
import { assertPlayerInClub } from "@/lib/scope";

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(changePlayerStatusSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const scope = await assertPlayerInClub(params.id, user.clubId);
  if (!scope.ok) {
    return scope.reason === "not_found" ? apiNotFound("Jugador no encontrado") : apiForbidden();
  }

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });
  if (!player) return apiNotFound("Jugador no encontrado");
  if (player.status === parsed.data.status) {
    return apiOk({ ok: true, unchanged: true });
  }

  await prisma.player.update({
    where: { id: player.id },
    data: { status: parsed.data.status },
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: player.id,
    action: "PLAYER_STATUS_CHANGED",
    changes: {
      from: player.status,
      to: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  return apiOk({ ok: true });
});
