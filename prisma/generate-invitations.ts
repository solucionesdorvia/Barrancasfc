/**
 * Genera 1 invitación de PROFESOR por cada categoría existente.
 * Cada link sirve para que UN profe se registre y quede asignado a esa cat.
 *
 * Si necesitás 2 profes para una misma categoría, volvé a correr el script
 * y vas a tener 2 links activos para esa categoría.
 *
 * Uso:
 *   npm run db:generate-invitations
 *
 * Output:
 *   Tabla con: Categoría | URL | Expira
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://barrancasfc-production-XXXX.up.railway.app";

async function main() {
  console.log("🎟️  Generando invitaciones de PROFESOR por categoría...\n");

  // Necesitamos un admin como createdById
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("❌ No hay ningún usuario admin en la DB. Creá uno primero.");
    process.exit(1);
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { year: "desc" }],
  });
  if (categories.length === 0) {
    console.error("❌ No hay categorías en la DB. Corré db:import-comet primero.");
    process.exit(1);
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 días
  const results: { categoryName: string; url: string }[] = [];

  for (const cat of categories) {
    const token = randomBytes(24).toString("base64url");
    await prisma.invitation.create({
      data: {
        token,
        role: "PROFESOR",
        title: `Profesor / DT — ${cat.name}`,
        clubId: cat.clubId,
        categoryIds: [cat.id],
        childrenIds: [],
        createdById: admin.id,
        expiresAt,
      },
    });
    results.push({
      categoryName: cat.name,
      url: `${APP_URL}/invite/${token}`,
    });
  }

  console.log(`✅ ${results.length} invitaciones creadas (expiran en 30 días)\n`);
  console.log("───────────────────────────────────────────────────────────");
  for (const r of results) {
    console.log(`📌 ${r.categoryName}`);
    console.log(`   ${r.url}\n`);
  }
  console.log("───────────────────────────────────────────────────────────");
  console.log("\nMandá cada link al profe correspondiente por WhatsApp/mail.");
  console.log("Al abrirlo va a ver 'Te invitaron como Profesor de XXX'");
  console.log("y crea su cuenta. Después puede tomar asistencia de su categoría.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
