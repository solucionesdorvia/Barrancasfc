import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { attendanceMarkSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole(["PROFESOR", "ADMIN"]);
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(attendanceMarkSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const date = new Date(parsed.data.date);
  date.setHours(0, 0, 0, 0);

  // Upsert en una sola transacción
  await prisma.$transaction(
    parsed.data.marks.map((m) =>
      prisma.attendance.upsert({
        where: { playerId_date: { playerId: m.playerId, date } },
        create: { playerId: m.playerId, date, present: m.present },
        update: { present: m.present },
      })
    )
  );

  const presentCount = parsed.data.marks.filter((m) => m.present).length;
  await logAudit({
    userId: user.id,
    entityType: "Attendance",
    entityId: parsed.data.categoryId ?? "global",
    action: "ATTENDANCE_RECORDED",
    changes: {
      date: date.toISOString(),
      total: parsed.data.marks.length,
      present: presentCount,
      absent: parsed.data.marks.length - presentCount,
    },
  });

  return apiOk({ ok: true, count: parsed.data.marks.length });
});
