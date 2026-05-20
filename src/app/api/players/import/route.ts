import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { playerImportSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

function parseDate(input: unknown): Date | null {
  if (input == null || input === "") return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (typeof input === "number") {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + input * 86400 * 1000);
  }
  const s = String(input).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const year = y.length === 2 ? 2000 + Number(y) : Number(y);
    const date = new Date(year, Number(mo) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function nullableString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(playerImportSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const [categories, existingPlayers] = await Promise.all([
    prisma.category.findMany({ where: { clubId: user.clubId } }),
    prisma.player.findMany({ select: { dni: true } }),
  ]);

  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c]));
  const existingDniSet = new Set(existingPlayers.map((p) => p.dni));
  const seenDnisInBatch = new Set<string>();

  const errors: { row: number; error: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const row = parsed.data.rows[i];
    const rowNum = i + 2; // +1 por header, +1 por 1-indexed

    try {
      const firstName = String(row.firstName ?? "").trim();
      const lastName = String(row.lastName ?? "").trim();
      const dni = String(row.dni ?? "").replace(/\D/g, "");
      const birthDate = parseDate(row.birthDate);
      const categoryName = String(row.categoryName ?? "").trim();

      if (!firstName || !lastName) throw new Error("Nombre/apellido vacío");
      if (!dni || dni.length < 7 || dni.length > 9) throw new Error("DNI inválido");
      if (!birthDate) throw new Error("Fecha de nacimiento inválida");
      if (birthDate > new Date()) throw new Error("Fecha de nacimiento futura");
      if (!categoryName) throw new Error("Categoría vacía");

      const cat = categoryByName.get(categoryName.toLowerCase());
      if (!cat) throw new Error(`Categoría no encontrada: "${categoryName}"`);
      if (existingDniSet.has(dni)) throw new Error(`DNI ya existe en el club: ${dni}`);
      if (seenDnisInBatch.has(dni)) throw new Error(`DNI duplicado en el Excel: ${dni}`);

      await prisma.player.create({
        data: {
          firstName,
          lastName,
          dni,
          birthDate,
          categoryId: cat.id,
          clubId: user.clubId,
          status: "ACTIVE",
          monthlyFee: cat.type === "INFANTIL" ? 35000 : 45000,
          paymentPlan: "MONTHLY",
          address: nullableString(row.address),
          healthInsurance: nullableString(row.healthInsurance),
          healthInsuranceNumber: nullableString(row.healthInsuranceNumber),
          emergencyContact: nullableString(row.emergencyContact),
          schoolName: nullableString(row.schoolName),
        },
      });
      seenDnisInBatch.add(dni);
      inserted++;
    } catch (e) {
      errors.push({ row: rowNum, error: e instanceof Error ? e.message : "Error desconocido" });
    }
  }

  if (inserted > 0) {
    await logAudit({
      userId: user.id,
      entityType: "System",
      entityId: "import",
      action: "PLAYERS_IMPORTED",
      changes: { inserted, errorCount: errors.length },
    });
  }

  return apiOk({ inserted, errors });
});
