import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiOk, withErrorHandler } from "@/lib/api";

/**
 * Generación mensual de cuotas.
 *
 * Reglas en orden:
 * 1. Skip categoría PROFESIONAL (Primera no paga).
 * 2. Skip jugadores con monthlyFee = 0 (becados full históricos).
 * 3. Beca: si scholarshipType=FULL (o scholarshipPercent=100) → NO se
 *    genera cuota para ese jugador. Si parcial, se aplica el descuento.
 * 4. Grupo familiar: si tiene familyGroupId + familyDiscountPercent, se
 *    aplica además del de beca (multiplicativo: cada uno reduce sobre el
 *    monto resultante del paso anterior).
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
      scholarshipType: true,
      scholarshipPercent: true,
    },
  });

  if (players.length === 0) return apiOk({ created: 0 });

  const existing = await prisma.payment.findMany({
    where: { month, year, playerId: { in: players.map((p) => p.id) } },
    select: { playerId: true },
  });
  const existingSet = new Set(existing.map((e) => e.playerId));

  let discountedByFamily = 0;
  let discountedByScholarship = 0;
  let skippedFullScholarship = 0;

  const toCreate = players
    .filter((p) => !existingSet.has(p.id))
    .map((p) => {
      const base = Number(p.monthlyFee);

      // Beca: porcentaje efectivo (PERCENT primero, sino derivar de TYPE).
      let schPct = 0;
      if (typeof p.scholarshipPercent === "number" && p.scholarshipPercent > 0) {
        schPct = p.scholarshipPercent;
      } else if (p.scholarshipType === "FULL") schPct = 100;
      else if (p.scholarshipType === "PARTIAL_50") schPct = 50;
      else if (p.scholarshipType === "PARTIAL_25") schPct = 25;

      // Si la beca es total, no se genera cuota.
      if (schPct >= 100) {
        skippedFullScholarship++;
        return null;
      }

      // Aplicamos descuento por beca.
      let amount = base;
      if (schPct > 0) {
        amount = Math.round((amount * (100 - schPct)) / 100);
        discountedByScholarship++;
      }

      // Y después el descuento por grupo familiar (sobre el monto ya descontado).
      if (p.familyGroupId && p.familyDiscountPercent && p.familyDiscountPercent > 0) {
        const fPct = Math.min(100, Math.max(0, p.familyDiscountPercent));
        amount = Math.round((amount * (100 - fPct)) / 100);
        discountedByFamily++;
      }

      return {
        playerId: p.id,
        amount,
        month,
        year,
        dueDate,
        status: "PENDING" as const,
      };
    })
    .filter((x): x is Exclude<typeof x, null> => x !== null);

  if (toCreate.length === 0) {
    return apiOk({ created: 0, skippedFullScholarship });
  }

  await prisma.payment.createMany({ data: toCreate });

  await logAudit({
    userId: user.id,
    entityType: "System",
    entityId: "payments",
    action: "PAYMENTS_GENERATED",
    changes: {
      month,
      year,
      count: toCreate.length,
      discountedByFamily,
      discountedByScholarship,
      skippedFullScholarship,
    },
  });

  return apiOk({
    created: toCreate.length,
    discountedByFamily,
    discountedByScholarship,
    skippedFullScholarship,
  });
});
