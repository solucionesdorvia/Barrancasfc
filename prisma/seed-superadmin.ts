/**
 * Bootstrap idempotente de SUPERADMIN.
 *
 * Si SUPERADMIN_EMAIL está seteada:
 * 1. Si el usuario existe en DB → promueve a SUPERADMIN
 * 2. Si NO existe en DB pero SÍ en Clerk → lo crea con role SUPERADMIN y
 *    linkea el clerkId, asociado al primer club de la DB (que es el "host"
 *    del SUPERADMIN — desde ahí navega a /super)
 * 3. Si no existe en ningún lado → loguea y sigue (no bloquea deploy)
 *
 * Corre en cada deploy. Eso garantiza que el primer SUPERADMIN puede arrancar
 * sin necesidad de pasar por el flujo de invitación.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log("ℹ SUPERADMIN_EMAIL no seteada; saltando bootstrap.");
    return;
  }

  // Paso 1: ¿está en DB?
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existing) {
    if (existing.role === "SUPERADMIN") {
      console.log(`✓ ${email} ya era SUPERADMIN.`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "SUPERADMIN" },
      });
      console.log(`✓ ${email} promovido de ${existing.role} a SUPERADMIN.`);
    }
    return;
  }

  // Paso 2: no está en DB. ¿Está en Clerk?
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.log(`⚠ ${email} no está en DB y no hay CLERK_SECRET_KEY para chequear Clerk.`);
    return;
  }

  let clerkId: string | null = null;
  try {
    const res = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
    if (res.ok) {
      const list = (await res.json()) as Array<{ id: string }>;
      if (list.length > 0) clerkId = list[0].id;
    }
  } catch (err) {
    console.warn(`⚠ Error consultando Clerk:`, err);
  }

  if (!clerkId) {
    console.log(`⚠ ${email} todavía no se registró en Clerk. Hacé sign-up primero.`);
    return;
  }

  // Paso 3: está en Clerk pero no en DB. Lo creo asociado al primer club.
  const firstClub = await prisma.club.findFirst({ orderBy: { createdAt: "asc" } });
  if (!firstClub) {
    console.log(`⚠ ${email} está en Clerk pero no hay clubes en DB. Cargá un club primero.`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      role: "SUPERADMIN",
      clerkId,
      clubId: firstClub.id,
    },
  });
  console.log(`✓ ${email} creado como SUPERADMIN (clerkId ${clerkId}, club ${firstClub.slug ?? firstClub.id}).`);
}

main()
  .catch((e) => {
    console.error("[seed-superadmin] failed:", e);
    process.exit(0);
  })
  .finally(() => prisma.$disconnect());
