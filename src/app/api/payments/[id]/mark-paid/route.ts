import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireRole("ADMIN");
  const body = await req.json().catch(() => ({}));
  const method = body.method ?? "Transferencia";

  const before = await prisma.payment.findUnique({ where: { id: params.id } });
  const payment = await prisma.payment.update({
    where: { id: params.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: method,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "Payment",
    entityId: payment.id,
    action: "PAYMENT_MARKED_PAID",
    changes: {
      playerId: payment.playerId,
      amount: Number(payment.amount),
      month: payment.month,
      year: payment.year,
      method,
      previousStatus: before?.status,
    },
  });

  return NextResponse.json(payment);
}
