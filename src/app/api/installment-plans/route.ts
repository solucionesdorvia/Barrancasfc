import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { installmentPlanCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

/**
 * Crear un plan de pagos para morosos.
 * Recibe una lista de paymentIds (cuotas atrasadas) y un nº de cuotas en las
 * que se las refinancia. Marca esos pagos como IN_PLAN y crea cuotas nuevas
 * con vencimientos mensuales a partir del próximo mes.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(installmentPlanCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  // Traer los pagos morosos seleccionados
  const overduePayments = await prisma.payment.findMany({
    where: {
      id: { in: parsed.data.paymentIds },
      playerId: parsed.data.playerId,
      status: { in: ["OVERDUE", "PENDING"] },
    },
  });
  if (overduePayments.length === 0) {
    return apiBadRequest("No hay cuotas válidas para refinanciar");
  }

  const totalAmount = overduePayments.reduce((s, p) => s + Number(p.amount), 0);
  const monthlyAmount = totalAmount / parsed.data.installments;

  // Crear el plan
  const plan = await prisma.installmentPlan.create({
    data: {
      playerId: parsed.data.playerId,
      totalAmount,
      installments: parsed.data.installments,
      notes: parsed.data.notes,
      createdById: user.id,
      paymentIds: overduePayments.map((p) => p.id),
    },
  });

  // Marcar los pagos originales como IN_PLAN
  await prisma.payment.updateMany({
    where: { id: { in: overduePayments.map((p) => p.id) } },
    data: { status: "IN_PLAN", notes: `Refinanciado en plan ${plan.id}` },
  });

  // Crear las nuevas cuotas del plan (1 por mes, comenzando el próximo mes)
  const now = new Date();
  const newPayments = [];
  for (let i = 0; i < parsed.data.installments; i++) {
    const due = new Date(now.getFullYear(), now.getMonth() + 1 + i, 10);
    newPayments.push({
      playerId: parsed.data.playerId,
      amount: monthlyAmount,
      month: due.getMonth() + 1,
      year: due.getFullYear(),
      dueDate: due,
      status: "PENDING" as const,
      notes: `Cuota ${i + 1}/${parsed.data.installments} del plan ${plan.id}`,
    });
  }
  await prisma.payment.createMany({ data: newPayments });

  await logAudit({
    userId: user.id,
    entityType: "InstallmentPlan",
    entityId: plan.id,
    action: "INSTALLMENT_PLAN_CREATED",
    changes: {
      playerId: parsed.data.playerId,
      totalAmount,
      installments: parsed.data.installments,
      monthlyAmount,
      refinancedPayments: overduePayments.length,
    },
  });

  return apiOk({ plan, monthlyAmount, totalAmount });
});
