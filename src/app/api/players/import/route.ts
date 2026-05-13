import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function parseDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
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
    return isNaN(date.getTime()) ? null : date;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  const user = await requireRole("ADMIN");
  const body = await req.json().catch(() => null);
  if (!body?.rows || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const categories = await prisma.category.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c]));

  const errors: { row: number; error: string }[] = [];
  let inserted = 0;

  for (let i = 0; i < body.rows.length; i++) {
    const row = body.rows[i];
    const rowNum = i + 2; // +1 por header, +1 por 1-indexed

    try {
      const firstName = String(row.firstName ?? "").trim();
      const lastName = String(row.lastName ?? "").trim();
      const dni = String(row.dni ?? "").replace(/\D/g, "");
      const birthDate = parseDate(row.birthDate);
      const categoryName = String(row.categoryName ?? "").trim();

      if (!firstName || !lastName) throw new Error("Nombre/apellido vacío");
      if (!dni || dni.length < 7) throw new Error("DNI inválido");
      if (!birthDate) throw new Error("Fecha de nacimiento inválida");
      if (!categoryName) throw new Error("Categoría vacía");

      const cat = categoryByName.get(categoryName.toLowerCase());
      if (!cat) throw new Error(`Categoría no encontrada: ${categoryName}`);

      const existing = await prisma.player.findUnique({ where: { dni } });
      if (existing) throw new Error(`DNI ya existe: ${dni}`);

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
          address: row.address ? String(row.address).trim() : null,
          healthInsurance: row.healthInsurance ? String(row.healthInsurance).trim() : null,
          healthInsuranceNumber: row.healthInsuranceNumber ? String(row.healthInsuranceNumber).trim() : null,
          emergencyContact: row.emergencyContact ? String(row.emergencyContact).trim() : null,
          schoolName: row.schoolName ? String(row.schoolName).trim() : null,
        },
      });
      inserted++;
    } catch (e) {
      errors.push({ row: rowNum, error: e instanceof Error ? e.message : "Error desconocido" });
    }
  }

  return NextResponse.json({ inserted, errors });
}
