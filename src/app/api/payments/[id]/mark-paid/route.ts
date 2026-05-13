import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const body = await req.json().catch(() => ({}));
  const method = body.method ?? "Transferencia";

  const payment = await prisma.payment.update({
    where: { id: params.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: method,
    },
  });

  return NextResponse.json(payment);
}
