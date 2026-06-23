/**
 * Setea slug + branding del club Barrancas FC sobre el club existente.
 * Idempotente: corrés esto cuando pusheás el schema nuevo y listo.
 *
 * Si en el futuro entra un segundo club, copiás este script y le cambiás
 * los valores. No hace falta tocar código.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Tomamos el primer (y único) club existente, sea cual sea su nombre,
  // y le aplicamos el branding de Barrancas FC.
  const existing = await prisma.club.findFirst({ orderBy: { createdAt: "asc" } });
  if (!existing) {
    console.log("⚠ No hay club en la DB. Corré el seed.ts primero.");
    return;
  }

  const updated = await prisma.club.update({
    where: { id: existing.id },
    data: {
      slug: "barrancas",
      name: "Barrancas FC",
      tagline: "Liga Profesional Argentina",
      // Colores REALES del club (rojo institucional). Anteriormente este seed
      // tenía verde y pisaba cualquier edición manual en cada deploy.
      primary:      "#C8102E",
      primaryHover: "#A30D24",
      primarySoft:  "#FEE7EA",
      onPrimary:    "#FFFFFF",
      accent:       "#0F172A",
      logo:         "/logo.png",
    },
  });

  console.log(`✓ Club actualizado: ${updated.name} (slug=${updated.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
