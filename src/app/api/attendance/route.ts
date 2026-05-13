import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  await requireRole(["PROFESOR", "ADMIN"]);
  const body = await req.json().catch(() => null);
  if (!body?.date || !Array.isArray(body?.marks)) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const date = new Date(body.date);
  date.setHours(0, 0, 0, 0);

  // upsert por (playerId, date)
  await Promise.all(
    body.marks.map((m: { playerId: string; present: boolean }) =>
      prisma.attendance.upsert({
        where: { playerId_date: { playerId: m.playerId, date } },
        create: { playerId: m.playerId, date, present: m.present },
        update: { present: m.present },
      })
    )
  );

  return NextResponse.json({ ok: true, count: body.marks.length });
}
