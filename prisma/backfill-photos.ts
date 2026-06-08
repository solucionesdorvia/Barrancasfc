/**
 * Backfill: agrega Dicebear photo URL a todos los jugadores que no tengan foto.
 * Idempotente: solo toca los que tienen `photo IS NULL`.
 *
 * Uso: npm run db:backfill-photos
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🖼️  Generando avatares Dicebear para jugadores sin foto...\n");

  const players = await prisma.player.findMany({
    where: { photo: null },
    select: { id: true, firstName: true, lastName: true, afaId: true },
  });
  console.log(`  ↳ ${players.length} jugadores sin foto`);

  if (players.length === 0) {
    console.log("\n✅ Todos los jugadores ya tienen avatar");
    return;
  }

  let updated = 0;
  for (const p of players) {
    const seed = `${p.firstName} ${p.lastName}${p.afaId ?? p.id}`;
    const photo = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    await prisma.player.update({ where: { id: p.id }, data: { photo } });
    updated++;
    if (updated % 50 === 0) console.log(`  ⏳ ${updated}/${players.length}`);
  }

  console.log(`\n✅ ${updated} jugadores actualizados`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
