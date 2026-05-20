import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { updatePlayerFeeSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";
import { assertPlayerInClub } from "@/lib/scope";

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(updatePlayerFeeSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const scope = await assertPlayerInClub(params.id, user.clubId);
  if (!scope.ok) {
    return scope.reason === "not_found" ? apiNotFound("Jugador no encontrado") : apiForbidden();
  }

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, monthlyFee: true },
  });
  if (!player) return apiNotFound("Jugador no encontrado");

  const previous = Number(player.monthlyFee);
  if (previous === parsed.data.monthlyFee) return apiOk({ ok: true, unchanged: true });

  await prisma.player.update({
    where: { id: player.id },
    data: { monthlyFee: parsed.data.monthlyFee },
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: player.id,
    action: "PLAYER_FEE_UPDATED",
    changes: {
      from: previous,
      to: parsed.data.monthlyFee,
    },
  });

  return apiOk({ ok: true });
});
