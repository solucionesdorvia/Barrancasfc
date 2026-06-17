/**
 * Idempotente: si la env var SUPERADMIN_EMAIL está seteada, busca ese usuario
 * en la DB y le sube el rol a SUPERADMIN. Si no existe todavía (no se registró
 * por primera vez), no falla — solo loguea.
 *
 * Corre en cada deploy para mantener la lista de SUPERADMINs en sync con env.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log("ℹ SUPERADMIN_EMAIL no seteada; saltando bootstrap de SUPERADMIN.");
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`⚠ Usuario ${email} todavía no existe en DB. Hacé sign-up primero y volvé a deployar.`);
    return;
  }

  if (user.role === "SUPERADMIN") {
    console.log(`✓ ${email} ya era SUPERADMIN. Nada que hacer.`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "SUPERADMIN" },
  });
  console.log(`✓ ${email} promovido a SUPERADMIN.`);
}

main()
  .catch((e) => {
    console.error("[seed-superadmin] failed:", e);
    process.exit(0); // no bloqueamos el deploy si falla
  })
  .finally(() => prisma.$disconnect());
