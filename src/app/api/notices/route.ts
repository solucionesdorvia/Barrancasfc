import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { noticeCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";
import { sendNoticeNotification, isMailerEnabled } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/base-url";
import { getCurrentClub } from "@/lib/club";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(noticeCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  // Si trae 1 sola opción de poll es inválido (necesita al menos 2 para votar)
  if (parsed.data.pollOptions.length === 1) {
    return apiBadRequest("Una encuesta necesita al menos 2 opciones");
  }

  const notice = await prisma.notice.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      pollOptions: parsed.data.pollOptions ?? [],
      pollClosesAt: parsed.data.pollClosesAt ? new Date(parsed.data.pollClosesAt) : null,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "Notice",
    entityId: notice.id,
    action: "NOTICE_CREATED",
    changes: {
      title: notice.title,
      isPoll: notice.pollOptions.length > 0,
      optionsCount: notice.pollOptions.length,
    },
  });

  // Notificación por mail (env-gated). Si RESEND_API_KEY no está, es no-op.
  if (isMailerEnabled()) {
    try {
      const padres = await prisma.user.findMany({
        where: { role: "PADRE", email: { not: "" } },
        select: { email: true },
      });
      const emails = padres.map((p) => p.email).filter(Boolean);
      if (emails.length > 0) {
        const club = await getCurrentClub();
        await sendNoticeNotification({
          recipients: emails,
          noticeTitle: notice.title,
          noticeBody: notice.body,
          isPoll: notice.pollOptions.length > 0,
          appUrl: getBaseUrl(),
          clubName: club?.name,
          clubPrimaryHex: club?.primary,
        });
      }
    } catch (e) {
      console.error("[notices] mailer failed:", e);
      // No bloqueamos la creación del aviso si falla el mail.
    }
  }

  return apiOk(notice);
});
