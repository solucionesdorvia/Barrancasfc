import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { eventCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(eventCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const event = await prisma.event.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      date: new Date(parsed.data.date),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      location: parsed.data.location,
      type: parsed.data.type,
      audience: parsed.data.audience,
      categoryId: parsed.data.categoryId,
      createdById: user.id,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "Event",
    entityId: event.id,
    action: "EVENT_CREATED",
    changes: { title: event.title, type: event.type, audience: event.audience, date: event.date.toISOString() },
  });

  return apiOk(event);
});
