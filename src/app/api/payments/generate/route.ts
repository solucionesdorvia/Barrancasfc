import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const user = await requireRole("ADMIN");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dueDate = new Date(year, month - 1, 10);

  const players = await prisma.player.findMany({
    where: {
      status: "ACTIVE",
      monthlyFee: { gt: 0 },
    },
    select: { id: true, monthlyFee: true },
  });

  const existing = await prisma.payment.findMany({
    where: { month, year, playerId: { in: players.map((p) => p.id) } },
    select: { playerId: true },
  });
  const existingSet = new Set(existing.map((e) => e.playerId));

  const toCreate = players
    .filter((p) => !existingSet.has(p.id))
    .map((p) => ({
      playerId: p.id,
      amount: p.monthlyFee,
      month,
      year,
      dueDate,
      status: "PENDING" as const,
    }));

  if (toCreate.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  await prisma.payment.createMany({ data: toCreate });

  await logAudit({
    userId: user.id,
    entityType: "System",
    entityId: "payments",
    action: "PAYMENTS_GENERATED",
    changes: { month, year, count: toCreate.length },
  });

  return NextResponse.json({ created: toCreate.length });
}
