/**
 * Importador de padres / tutores.
 *
 * Uso:
 *   npx tsx prisma/import-parents.ts /ruta/a/padres.xlsx
 *
 * Columnas esperadas en el .xlsx (primera fila como header):
 *
 *   ID AFA Hijo        → afaId del jugador a vincular (obligatorio)
 *   Nombre Padre       → firstName (obligatorio)
 *   Apellido Padre     → lastName  (opcional)
 *   Email              → email     (opcional pero recomendado)
 *   Telefono           → phone     (opcional)
 *   Parentesco         → relation  (opcional, default "Padre/Madre")
 *
 * El script:
 *   1) Lee el Excel
 *   2) Para cada fila busca el Player por afaId
 *   3) Si el padre (matcheado por email O por nombre+apellido) ya existe, lo
 *      vincula al hijo. Si no, lo crea con role=PADRE y lo vincula.
 *   4) Nunca duplica un vínculo si ya existe.
 *
 * NOTA: este script NO crea cuentas Clerk. Los padres importados quedan en la
 * tabla User con clerkId = "" (placeholder). Cuando el padre se registre por
 * primera vez con su email a través de una invitación o signup, el callback
 * tiene que matchear por email y completar el clerkId.
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const filePath = process.argv[2];
if (!filePath) {
  console.error("Falta el path. Uso: npx tsx prisma/import-parents.ts /ruta/al/padres.xlsx");
  process.exit(1);
}

const HEADER_MAP: Record<string, string> = {
  "id afa hijo": "childAfaId",
  "afa hijo": "childAfaId",
  "id hijo": "childAfaId",
  "afa id hijo": "childAfaId",
  "nombre padre": "firstName",
  "nombre": "firstName",
  "apellido padre": "lastName",
  "apellido": "lastName",
  "email": "email",
  "mail": "email",
  "telefono": "phone",
  "celular": "phone",
  "parentesco": "relation",
  "rol": "relation",
};

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function main() {
  console.log(`📂 Leyendo ${filePath} ...`);
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  console.log(`  → ${rows.length} filas leídas\n`);

  if (rows.length === 0) {
    console.log("Excel vacío. Nada que hacer.");
    return;
  }

  const headerMap = new Map<string, string>();
  for (const rawHeader of Object.keys(rows[0])) {
    const canonical = HEADER_MAP[normalize(rawHeader)];
    if (canonical) headerMap.set(rawHeader, canonical);
  }
  console.log(`🧭 Headers reconocidos: ${[...headerMap.values()].join(", ")}\n`);

  let createdUsers = 0;
  let reusedUsers = 0;
  let createdLinks = 0;
  let skippedLinks = 0;
  const notFoundChildren: string[] = [];
  const missingName: number[] = [];

  for (const [idx, row] of rows.entries()) {
    const fields: Record<string, string> = {};
    for (const [rawHeader, canonical] of headerMap) {
      const raw = row[rawHeader];
      if (raw === "" || raw === null || raw === undefined) continue;
      fields[canonical] = String(raw).trim();
    }

    const childAfaId = fields.childAfaId;
    const firstName = fields.firstName;
    const lastName = fields.lastName ?? "";
    const email = fields.email?.toLowerCase() ?? "";
    const phone = fields.phone ?? "";

    if (!childAfaId) continue;
    if (!firstName) {
      missingName.push(idx + 2);
      continue;
    }

    const child = await prisma.player.findUnique({ where: { afaId: childAfaId }, select: { id: true } });
    if (!child) {
      notFoundChildren.push(childAfaId);
      continue;
    }

    // Buscar padre existente: primero por email (si lo trajo), después por nombre+apellido
    let parent: { id: string } | null = null;
    if (email) {
      parent = await prisma.user.findFirst({ where: { email }, select: { id: true } });
    }
    if (!parent && firstName) {
      const fullName = `${firstName}${lastName ? " " + lastName : ""}`;
      parent = await prisma.user.findFirst({
        where: {
          role: "PADRE",
          name: { equals: fullName, mode: "insensitive" },
        },
        select: { id: true },
      });
    }

    if (parent) {
      reusedUsers++;
    } else {
      // Crear nuevo padre. clerkId queda vacío hasta que se loguee.
      try {
        // Necesitamos un clubId, agarramos el primero (en este MVP hay uno solo)
        const club = await prisma.club.findFirst({ select: { id: true } });
        if (!club) throw new Error("No hay ningún Club registrado en la base");

        const created = await prisma.user.create({
          data: {
            clerkId: `pending_${Date.now()}_${idx}`, // placeholder único
            email: email || `${firstName.toLowerCase()}.${(lastName || "padre").toLowerCase()}.${idx}@pendiente.local`,
            name: `${firstName}${lastName ? " " + lastName : ""}`,
            role: "PADRE",
            clubId: club.id,
            // phone se podría almacenar en title o en un campo futuro; por
            // ahora lo dejamos en el log de auditoría.
          },
        });
        if (phone) {
          console.log(`   ℹ fila ${idx + 2}: teléfono "${phone}" no se persiste (campo no existe en User)`);
        }
        parent = { id: created.id };
        createdUsers++;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          // Email duplicado de otra fila ya creada en esta corrida
          parent = await prisma.user.findFirst({ where: { email }, select: { id: true } });
          if (parent) reusedUsers++;
          else {
            console.warn(`  ⚠ fila ${idx + 2}: email duplicado pero no encontrado en lookup`);
            continue;
          }
        } else {
          throw e;
        }
      }
    }

    if (!parent) continue;

    // Vincular: la relación parents es many-to-many entre User y Player.
    try {
      await prisma.user.update({
        where: { id: parent.id },
        data: { children: { connect: { id: child.id } } },
      });
      createdLinks++;
    } catch {
      // Si ya estaba vinculado, ignoramos
      skippedLinks++;
    }
  }

  console.log("\n✓ Resumen:");
  console.log(`   • ${createdUsers} padres nuevos creados`);
  console.log(`   • ${reusedUsers} padres reutilizados (ya existían)`);
  console.log(`   • ${createdLinks} vínculos padre↔hijo creados`);
  console.log(`   • ${skippedLinks} vínculos ya existentes (ignorados)`);
  console.log(`   • ${missingName.length} filas sin nombre (saltadas) ${missingName.length ? "líneas: " + missingName.slice(0, 20).join(",") : ""}`);
  console.log(`   • ${notFoundChildren.length} ID AFA de hijos no encontrados`);
  if (notFoundChildren.length > 0 && notFoundChildren.length <= 30) {
    console.log("   IDs no encontrados:", notFoundChildren.join(", "));
  }
}

main()
  .catch((e) => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
