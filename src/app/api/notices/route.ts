import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { noticeCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(noticeCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const notice = await prisma.notice.create({
    data: parsed.data,
  });

  await logAudit({
    userId: user.id,
    entityType: "System",
    entityId: notice.id,
    action: "NOTICE_CREATED",
    changes: { title: notice.title },
  });

  return apiOk(notice);
});
