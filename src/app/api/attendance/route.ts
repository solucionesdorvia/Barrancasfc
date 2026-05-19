import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await requireRole(["PROFESOR", "ADMIN"]);
  const body = await req.json().catch(() => null);
  if (!body?.date || !Array.isArray(body?.marks)) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const date = new Date(body.date);
  date.setHours(0, 0, 0, 0);

  await Promise.all(
    body.marks.map((m: { playerId: string; present: boolean }) =>
      prisma.attendance.upsert({
        where: { playerId_date: { playerId: m.playerId, date } },
        create: { playerId: m.playerId, date, present: m.present },
        update: { present: m.present },
      })
    )
  );

  const presentCount = body.marks.filter((m: { present: boolean }) => m.present).length;
  await logAudit({
    userId: user.id,
    entityType: "Attendance",
    entityId: body.categoryId ?? "global",
    action: "ATTENDANCE_RECORDED",
    changes: {
      date: date.toISOString(),
      total: body.marks.length,
      present: presentCount,
      absent: body.marks.length - presentCount,
    },
  });

  return NextResponse.json({ ok: true, count: body.marks.length });
}
