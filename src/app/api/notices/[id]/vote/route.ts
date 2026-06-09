import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * Votar en una encuesta. Cualquier usuario logueado puede votar 1 vez por aviso.
 * Body: { optionIdx: number }
 */
export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const optionIdx = Number(body.optionIdx);

  if (!Number.isInteger(optionIdx) || optionIdx < 0) {
    return apiBadRequest("Opción inválida");
  }

  const notice = await prisma.notice.findUnique({ where: { id: params.id } });
  if (!notice) return apiNotFound("Aviso no encontrado");
  if (notice.pollOptions.length === 0) return apiBadRequest("Este aviso no es una encuesta");
  if (optionIdx >= notice.pollOptions.length) return apiBadRequest("Opción fuera de rango");
  if (notice.pollClosesAt && notice.pollClosesAt < new Date()) {
    return apiBadRequest("La votación ya cerró");
  }

  // Upsert: si ya votó, actualiza su voto
  await prisma.noticeVote.upsert({
    where: { noticeId_userId: { noticeId: notice.id, userId: user.id } },
    create: { noticeId: notice.id, userId: user.id, optionIdx },
    update: { optionIdx },
  });

  await logAudit({
    userId: user.id,
    entityType: "Notice",
    entityId: notice.id,
    action: "POLL_VOTED",
    changes: { optionIdx, option: notice.pollOptions[optionIdx] },
  });

  return apiOk({ ok: true });
});
