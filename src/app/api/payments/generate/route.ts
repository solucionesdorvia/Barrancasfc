import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiOk, withErrorHandler } from "@/lib/api";

/**
 * Generación mensual de cuotas.
 *
 * Reglas:
 * - Skip categoría PROFESIONAL (Primera no paga).
 * - Skip jugadores con monthlyFee = 0 (becados full).
 * - Si el jugador tiene `familyGroupId` y `familyDiscountPercent`, aplicamos
 *   el descuento sobre el monto base. Ej: 20% → cobra 80%.
 *   La idea es que en familias con varios hermanos, el admin marca el grupo
 *   y el % de descuento (típicamente entre 10 y 25%).
 */
export const POST = withErrorHandler(async () => {
  const user = await requireRole("ADMIN");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const dueDate = new Date(year, month - 1, 10);

  const players = await prisma.player.findMany({
    where: {
      status: "ACTIVE",
      monthlyFee: { gt: 0 },
      category: { type: { not: "PROFESIONAL" } },
    },
    select: {
      id: true,
      monthlyFee: true,
      familyGroupId: true,
      familyDiscountPercent: true,
    },
  });

  if (players.length === 0) return apiOk({ created: 0 });

  const existing = await prisma.payment.findMany({
    where: { month, year, playerId: { in: players.map((p) => p.id) } },
    select: { playerId: true },
  });
  const existingSet = new Set(existing.map((e) => e.playerId));

  let discountedCount = 0;
  const toCreate = players
    .filter((p) => !existingSet.has(p.id))
    .map((p) => {
      let amount: number | typeof p.monthlyFee = p.monthlyFee;
      // Aplicar descuento por grupo familiar
      if (p.familyGroupId && p.familyDiscountPercent && p.familyDiscountPercent > 0) {
        const pct = Math.min(100, Math.max(0, p.familyDiscountPercent));
        const base = Number(p.monthlyFee);
        amount = Math.round((base * (100 - pct)) / 100);
        discountedCount++;
      }
      return {
        playerId: p.id,
        amount,
        month,
        year,
        dueDate,
        status: "PENDING" as const,
      };
    });

  if (toCreate.length === 0) return apiOk({ created: 0 });

  await prisma.payment.createMany({ data: toCreate });

  await logAudit({
    userId: user.id,
    entityType: "System",
    entityId: "payments",
    action: "PAYMENTS_GENERATED",
    changes: { month, year, count: toCreate.length, discountedByFamily: discountedCount },
  });

  return apiOk({ created: toCreate.length, discountedByFamily: discountedCount });
});
