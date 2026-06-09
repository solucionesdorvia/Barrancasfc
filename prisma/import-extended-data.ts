/**
 * Importador de datos extendidos por jugador desde Excel del cliente.
 *
 * Uso:
 *   npx tsx prisma/import-extended-data.ts /ruta/a/datos-extendidos.xlsx
 *
 * Espera un Excel con UNA hoja, primera fila como header. Columnas reconocidas
 * (cualquiera puede faltar — se ignora silenciosamente):
 *
 *   ID AFA              → afaId (obligatorio para hacer match)
 *   Nombre              → opcional, solo para validar el match
 *   Domicilio           → address
 *   Localidad           → locality
 *   Provincia           → province
 *   Telefono            → personalPhone
 *   Email               → personalEmail
 *   Email notificacion  → notificationEmail
 *   Emergencia nombre   → emergencyContactName
 *   Emergencia parentesco → emergencyContactRelation
 *   Emergencia telefono → emergencyContactPhone
 *   Emergencia email    → emergencyContactEmail
 *   Obra social         → healthInsurance
 *   Plan                → healthInsurancePlan
 *   Numero socio        → healthInsuranceNumber
 *   Colegio             → schoolName
 *   Nivel               → schoolStatus (PRIMARIA|SECUNDARIA|TERCIARIO|UNIVERSITARIO|FINALIZADO|OTRO)
 *   Turno               → schoolShift   (MANANA|TARDE|NOCHE|DOBLE)
 *   Hora entrada        → schoolStartTime
 *   Salida martes       → schoolEndTimeTuesday
 *   Salida miercoles    → schoolEndTimeWednesday
 *   Salida jueves       → schoolEndTimeThursday
 *   Salida viernes      → schoolEndTimeFriday
 *   Indumentaria paga   → clothingPaid (Si/No)
 *   Estado pase         → transferStatus (SIN_PASE|EN_TRAMITE|CONFIRMADO)
 *   Inscripto 2025      → registeredIn2025 (Si/No)
 *   Ciudadania          → citizenship
 *   Observaciones       → observations
 *
 * El script:
 *  - Lee la primera hoja del .xlsx
 *  - Para cada fila, busca el Player por afaId
 *  - Hace UPDATE solo de los campos que vienen en el Excel (no pisa con null)
 *  - Imprime resumen al final
 *
 * No crea jugadores nuevos. Si un afaId no matchea, lo lista al final.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const filePath = process.argv[2];
if (!filePath) {
  console.error("Falta el path al .xlsx. Uso: npx tsx prisma/import-extended-data.ts /ruta/al/archivo.xlsx");
  process.exit(1);
}

const COL_MAP: Record<string, string> = {
  "id afa": "afaId",
  "afa id": "afaId",
  "id": "afaId",
  "domicilio": "address",
  "direccion": "address",
  "localidad": "locality",
  "provincia": "province",
  "telefono": "personalPhone",
  "celular": "personalPhone",
  "email": "personalEmail",
  "email notificacion": "notificationEmail",
  "email de notificacion": "notificationEmail",
  "emergencia nombre": "emergencyContactName",
  "contacto emergencia": "emergencyContactName",
  "emergencia parentesco": "emergencyContactRelation",
  "parentesco": "emergencyContactRelation",
  "emergencia telefono": "emergencyContactPhone",
  "emergencia email": "emergencyContactEmail",
  "obra social": "healthInsurance",
  "plan": "healthInsurancePlan",
  "numero socio": "healthInsuranceNumber",
  "n socio": "healthInsuranceNumber",
  "colegio": "schoolName",
  "escuela": "schoolName",
  "nivel": "schoolStatus",
  "turno": "schoolShift",
  "hora entrada": "schoolStartTime",
  "salida martes": "schoolEndTimeTuesday",
  "salida miercoles": "schoolEndTimeWednesday",
  "salida miércoles": "schoolEndTimeWednesday",
  "salida jueves": "schoolEndTimeThursday",
  "salida viernes": "schoolEndTimeFriday",
  "indumentaria paga": "clothingPaid",
  "indumentaria": "clothingPaid",
  "estado pase": "transferStatus",
  "pase": "transferStatus",
  "inscripto 2025": "registeredIn2025",
  "ciudadania": "citizenship",
  "ciudadanía": "citizenship",
  "observaciones": "observations",
  "nota": "observations",
};

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function parseBoolean(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (["si", "sí", "yes", "true", "1", "x"].includes(s)) return true;
  if (["no", "false", "0"].includes(s)) return false;
  return undefined;
}

function parseEnum<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  if (!v) return undefined;
  const s = String(v).trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return (allowed as readonly string[]).includes(s) ? (s as T) : undefined;
}

async function main() {
  console.log(`📂 Leyendo ${filePath} ...`);
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  console.log(`  → ${rows.length} filas leídas\n`);

  // Mapear headers reales del Excel a nuestros campos canónicos
  const headerMap = new Map<string, string>();
  if (rows[0]) {
    for (const rawHeader of Object.keys(rows[0])) {
      const canonical = COL_MAP[normalize(rawHeader)];
      if (canonical) headerMap.set(rawHeader, canonical);
    }
  }
  console.log(`🧭 Headers reconocidos: ${[...headerMap.values()].join(", ")}\n`);

  if (!headerMap.has(Object.keys(rows[0] ?? {}).find((k) => headerMap.get(k) === "afaId") ?? "")) {
    // re-check: tiene que haber al menos una columna que mapee a afaId
    const hasAfaId = [...headerMap.values()].includes("afaId");
    if (!hasAfaId) {
      console.error("❌ No se encontró columna 'ID AFA' (o 'AFA ID' / 'ID'). Es obligatoria para hacer match.");
      process.exit(1);
    }
  }

  let updated = 0;
  let skipped = 0;
  const notFound: string[] = [];

  for (const row of rows) {
    const data: Record<string, unknown> = {};
    let afaId: string | null = null;

    for (const [rawHeader, canonical] of headerMap) {
      const raw = row[rawHeader];
      if (raw === "" || raw === null || raw === undefined) continue;

      if (canonical === "afaId") {
        afaId = String(raw).trim();
        continue;
      }
      if (canonical === "clothingPaid" || canonical === "registeredIn2025") {
        const b = parseBoolean(raw);
        if (b !== undefined) data[canonical] = b;
        continue;
      }
      if (canonical === "schoolStatus") {
        const v = parseEnum(raw, ["PRIMARIA", "SECUNDARIA", "TERCIARIO", "UNIVERSITARIO", "FINALIZADO", "OTRO"] as const);
        if (v) data[canonical] = v;
        continue;
      }
      if (canonical === "schoolShift") {
        const v = parseEnum(raw, ["MANANA", "TARDE", "NOCHE", "DOBLE"] as const);
        if (v) data[canonical] = v;
        continue;
      }
      if (canonical === "transferStatus") {
        const v = parseEnum(raw, ["SIN_PASE", "EN_TRAMITE", "CONFIRMADO"] as const);
        if (v) data[canonical] = v;
        continue;
      }
      // Para strings normales
      const s = String(raw).trim();
      if (s) data[canonical] = s;
    }

    if (!afaId) {
      skipped++;
      continue;
    }
    if (Object.keys(data).length === 0) {
      skipped++;
      continue;
    }

    const player = await prisma.player.findUnique({ where: { afaId } });
    if (!player) {
      notFound.push(afaId);
      continue;
    }

    // hasHealthInsurance derivado de healthInsurance presente
    if (typeof data.healthInsurance === "string" && data.healthInsurance.length > 0) {
      data.hasHealthInsurance = true;
    }

    await prisma.player.update({ where: { id: player.id }, data });
    updated++;
  }

  console.log("\n✓ Resumen:");
  console.log(`   • ${updated} jugadores actualizados`);
  console.log(`   • ${skipped} filas vacías o sin afaId`);
  console.log(`   • ${notFound.length} afaId no encontrados en la base`);
  if (notFound.length > 0 && notFound.length <= 30) {
    console.log("   IDs no matcheados:", notFound.join(", "));
  } else if (notFound.length > 30) {
    console.log("   Primeros 30 IDs no matcheados:", notFound.slice(0, 30).join(", "));
  }
}

main()
  .catch((e) => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
