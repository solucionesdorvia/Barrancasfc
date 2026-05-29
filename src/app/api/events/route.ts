import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { eventCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

/**
 * Genera la lista de fechas que cumplen la regla de recurrencia.
 * Tope de seguridad: máximo 365 eventos por serie (1 año diario).
 */
function expandRecurrence(opts: {
  base: Date;
  endBase: Date | null;
  repeatType: "NONE" | "DAILY" | "WEEKLY";
  daysOfWeek: number[];
  until: Date | null;
}): { date: Date; endDate: Date | null }[] {
  const { base, endBase, repeatType, daysOfWeek, until } = opts;
  if (repeatType === "NONE" || !until) {
    return [{ date: base, endDate: endBase }];
  }

  const out: { date: Date; endDate: Date | null }[] = [];
  const durationMs = endBase ? endBase.getTime() - base.getTime() : 0;
  const limit = new Date(until);
  limit.setHours(23, 59, 59, 999);

  const MAX_INSTANCES = 365;

  const cursor = new Date(base);
  while (cursor <= limit && out.length < MAX_INSTANCES) {
    let include = false;
    if (repeatType === "DAILY") {
      include = true;
    } else if (repeatType === "WEEKLY") {
      // Si no especifica daysOfWeek, asumimos el mismo día de la semana del base
      if (daysOfWeek.length === 0) {
        include = cursor.getDay() === base.getDay();
      } else {
        include = daysOfWeek.includes(cursor.getDay());
      }
    }
    if (include) {
      const date = new Date(cursor);
      const endDate = durationMs > 0 ? new Date(date.getTime() + durationMs) : null;
      out.push({ date, endDate });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return out;
}

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(eventCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const base = new Date(parsed.data.date);
  const endBase = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
  const until = parsed.data.repeatUntil ? new Date(parsed.data.repeatUntil) : null;
  const isRecurring = parsed.data.repeatType !== "NONE" && until;

  if (isRecurring && !until) {
    return apiBadRequest("Si activás la repetición, tenés que indicar hasta cuándo");
  }
  if (isRecurring && until && until < base) {
    return apiBadRequest("La fecha de fin de la repetición tiene que ser posterior a la fecha de inicio");
  }

  const instances = expandRecurrence({
    base,
    endBase,
    repeatType: parsed.data.repeatType ?? "NONE",
    daysOfWeek: parsed.data.daysOfWeek ?? [],
    until,
  });

  if (instances.length === 0) {
    return apiBadRequest("La regla de repetición no genera ninguna fecha válida");
  }

  const seriesId = instances.length > 1 ? randomBytes(12).toString("base64url") : null;
  const sharedData = {
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
    type: parsed.data.type,
    audience: parsed.data.audience,
    categoryId: parsed.data.categoryId,
    createdById: user.id,
    seriesId,
  };

  if (instances.length === 1) {
    const event = await prisma.event.create({
      data: { ...sharedData, date: instances[0].date, endDate: instances[0].endDate },
    });
    await logAudit({
      userId: user.id,
      entityType: "Event",
      entityId: event.id,
      action: "EVENT_CREATED",
      changes: { title: event.title, type: event.type, audience: event.audience, date: event.date.toISOString() },
    });
    return apiOk(event);
  }

  // Crear toda la serie en una transacción
  await prisma.event.createMany({
    data: instances.map((i) => ({ ...sharedData, date: i.date, endDate: i.endDate })),
  });

  await logAudit({
    userId: user.id,
    entityType: "Event",
    entityId: seriesId!,
    action: "EVENT_CREATED",
    changes: {
      seriesId,
      title: parsed.data.title,
      count: instances.length,
      repeatType: parsed.data.repeatType,
      from: instances[0].date.toISOString(),
      until: instances[instances.length - 1].date.toISOString(),
    },
  });

  return apiOk({ seriesId, count: instances.length });
});
