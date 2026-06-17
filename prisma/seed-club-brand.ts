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
      tagline: "Inferiores · Buenos Aires",
      primary:      "#0F6E56",  // verde Barrancas (acordamos del tokens.css)
      primaryHover: "#0A5443",
      primarySoft:  "#E1F5EE",
      onPrimary:    "#E1F5EE",
      accent:       "#F97316",
      // contactos si querés que las plantillas firmen con número/email del club
      contactWhatsapp: null,
      contactEmail:    null,
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
