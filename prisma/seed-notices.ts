/**
 * Crea avisos de bienvenida iniciales para que los padres vean algo
 * cuando entren a la app por primera vez.
 *
 * Es idempotente: si los avisos ya existen (por title), no los duplica.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOTICES = [
  {
    title: "🎉 ¡Bienvenidos al sistema del club!",
    body: `Hola familia,

Desde hoy podés gestionar todo lo del club desde tu celular o computadora:
• Ver las cuotas de tu hijo y pagarlas online
• Cargar la documentación necesaria
• Ver las asistencias a entrenamientos
• Mantenerte al tanto de avisos, partidos y entrenamientos

Si tenés alguna duda escribinos al WhatsApp del club. ¡Gracias por confiar en nosotros!`,
  },
  {
    title: "📋 Completá los datos de tu hijo",
    body: `Para tenerlo todo en orden y poder contactarte ante una urgencia, te pedimos que completes los datos del perfil:

→ Andá al tab "Perfil" en la parte de abajo de la app.

Datos importantes:
• Tu teléfono y mail de contacto
• Contacto de emergencia
• Datos de obra social
• Horarios escolares (para coordinar entrenamientos)

Tardás menos de 5 minutos y nos ayudás a tener todo al día.`,
  },
  {
    title: "💳 Sobre el pago de cuotas",
    body: `Las cuotas de cada mes se generan los primeros días y vencen el día 10.

Próximamente vas a poder pagarlas directo desde la app con Mercado Pago. Mientras tanto, pueden seguir abonando por transferencia o en la sede.

Si tu hijo es de Primera División, no tiene cuota.

Cualquier duda sobre tu situación de cuenta, contactá a Tesorería.`,
  },
];

async function main() {
  console.log("📢 Creando avisos de bienvenida...\n");

  let created = 0;
  let skipped = 0;
  for (const n of NOTICES) {
    const existing = await prisma.notice.findFirst({ where: { title: n.title } });
    if (existing) {
      console.log(`  ⏭️  Ya existe: "${n.title}"`);
      skipped++;
      continue;
    }
    await prisma.notice.create({ data: n });
    console.log(`  ✓ Creado: "${n.title}"`);
    created++;
  }

  console.log(`\n✅ ${created} creados, ${skipped} omitidos (ya existían)`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
