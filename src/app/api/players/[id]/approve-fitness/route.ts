import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { approveFitnessSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";
import { assertPlayerInClub } from "@/lib/scope";

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(approveFitnessSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const expiry = new Date(parsed.data.expiry);
  if (Number.isNaN(expiry.getTime())) return apiBadRequest("Fecha inválida");

  const scope = await assertPlayerInClub(params.id, user.clubId);
  if (!scope.ok) {
    return scope.reason === "not_found" ? apiNotFound("Jugador no encontrado") : apiForbidden();
  }

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, fitnessExpiry: true },
  });
  if (!player) return apiNotFound("Jugador no encontrado");

  const before = player.fitnessExpiry;
  await prisma.player.update({
    where: { id: player.id },
    data: { fitnessExpiry: expiry },
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: player.id,
    action: "FITNESS_APPROVED",
    changes: {
      previousExpiry: before?.toISOString() ?? null,
      newExpiry: expiry.toISOString(),
      notes: parsed.data.notes,
    },
  });

  return apiOk({ ok: true, expiry: expiry.toISOString() });
});
