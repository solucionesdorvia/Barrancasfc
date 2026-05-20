import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { markPaidSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiConflict, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(markPaidSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const before = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      player: {
        select: { clubId: true, parents: { select: { id: true } } },
      },
    },
  });
  if (!before) return apiNotFound("Pago no encontrado");
  if (before.player.clubId !== user.clubId) return apiForbidden();

  // Permitir ADMIN siempre, PADRE solo si es padre del jugador
  const isAdmin = user.role === "ADMIN";
  const isParentOfPlayer = user.role === "PADRE" && before.player.parents.some((p) => p.id === user.id);
  if (!isAdmin && !isParentOfPlayer) return apiForbidden();

  if (before.status === "PAID") return apiConflict("La cuota ya figura como pagada");

  const payment = await prisma.payment.update({
    where: { id: params.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: parsed.data.method,
      notes: parsed.data.notes,
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
      method: parsed.data.method,
      previousStatus: before.status,
      paidByRole: user.role,
    },
  });

  return apiOk(payment);
});
