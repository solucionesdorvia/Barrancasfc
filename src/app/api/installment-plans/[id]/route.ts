import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * DELETE - cancelar un plan de pagos.
 * Marca el plan como CANCELLED, las cuotas refinanciadas vuelven a OVERDUE
 * y las cuotas nuevas del plan se eliminan si están PENDING.
 */
export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const plan = await prisma.installmentPlan.findUnique({ where: { id: params.id } });
  if (!plan) return apiNotFound("Plan no encontrado");

  await prisma.installmentPlan.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  // Revertir cuotas originales a OVERDUE
  await prisma.payment.updateMany({
    where: { id: { in: plan.paymentIds } },
    data: { status: "OVERDUE" },
  });

  // Eliminar cuotas del plan que sigan pendientes
  await prisma.payment.deleteMany({
    where: {
      playerId: plan.playerId,
      status: "PENDING",
      notes: { contains: `del plan ${plan.id}` },
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "InstallmentPlan",
    entityId: plan.id,
    action: "INSTALLMENT_PLAN_CANCELLED",
    changes: { playerId: plan.playerId, totalAmount: Number(plan.totalAmount) },
  });

  return apiOk({ ok: true });
});
