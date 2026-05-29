import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { eventUpdateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return apiNotFound("Evento no encontrado");

  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(eventUpdateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date) data.date = new Date(parsed.data.date);
  if (parsed.data.endDate) data.endDate = new Date(parsed.data.endDate);

  const updated = await prisma.event.update({ where: { id: params.id }, data });
  await logAudit({
    userId: user.id,
    entityType: "Event",
    entityId: event.id,
    action: "EVENT_UPDATED",
    changes: parsed.data,
  });

  return apiOk(updated);
});

export const DELETE = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return apiNotFound("Evento no encontrado");

  // Si pasan ?series=true, borramos toda la serie. Default: solo esta ocurrencia.
  const url = new URL(req.url);
  const deleteSeries = url.searchParams.get("series") === "true";

  if (deleteSeries && event.seriesId) {
    const res = await prisma.event.deleteMany({ where: { seriesId: event.seriesId } });
    await logAudit({
      userId: user.id,
      entityType: "Event",
      entityId: event.seriesId,
      action: "EVENT_DELETED",
      changes: { seriesId: event.seriesId, deleted: res.count, title: event.title },
    });
    return apiOk({ ok: true, deleted: res.count });
  }

  await prisma.event.delete({ where: { id: params.id } });
  await logAudit({
    userId: user.id,
    entityType: "Event",
    entityId: event.id,
    action: "EVENT_DELETED",
    changes: { title: event.title, date: event.date.toISOString() },
  });

  return apiOk({ ok: true, deleted: 1 });
});
