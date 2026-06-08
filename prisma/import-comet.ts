/**
 * Importador de planillas COMET / AFA.
 *
 * Uso:
 *   npx tsx prisma/import-comet.ts /ruta/a/carpeta/planillas
 *
 * Si no se pasa la ruta, usa /Users/valentindoroszuk/Downloads por default.
 *
 * Lee los 11 archivos (TPA, 4ta-9na, 2013-2016 Inf), parsea cada planilla,
 * y crea/actualiza jugadores. Si un jugador aparece en más de una categoría,
 * lo crea una sola vez con su `categoryId` = principal (la más alta = más
 * pequeña en número o el año mayor) y agrega las demás como
 * `additionalCategories`.
 *
 * IMPORTANTE: borra todo el plantel anterior, pagos, asistencias, notas y
 * planes de pago. Conserva los usuarios staff (admin/profesor/padre) pero
 * desvincula sus children.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const DOWNLOADS = process.argv[2] || "/Users/valentindoroszuk/Downloads";

type Planilla = {
  file: string;
  categoryName: string;
  categoryType: "PROFESIONAL" | "JUVENIL" | "INFANTIL";
  year: number;
  /** Cuota mensual por defecto para la categoría */
  monthlyFee: number;
  /** Prioridad para elegir categoría principal cuando un jugador está en varias.
   *  Mayor = más jerarquía. */
  priority: number;
};

const PLANILLAS: Planilla[] = [
  { file: "TPA.xls",       categoryName: "Primera División", categoryType: "PROFESIONAL", year: 2005, monthlyFee: 0,     priority: 100 },
  { file: "4ta.xls",       categoryName: "4ta División",     categoryType: "JUVENIL",     year: 2007, monthlyFee: 50000, priority: 90 },
  { file: "5ta.xls",       categoryName: "5ta División",     categoryType: "JUVENIL",     year: 2008, monthlyFee: 50000, priority: 80 },
  { file: "6ta.xls",       categoryName: "6ta División",     categoryType: "JUVENIL",     year: 2009, monthlyFee: 50000, priority: 70 },
  { file: "7ma.xls",       categoryName: "7ma División",     categoryType: "JUVENIL",     year: 2010, monthlyFee: 45000, priority: 60 },
  { file: "8va.xls",       categoryName: "8va División",     categoryType: "JUVENIL",     year: 2011, monthlyFee: 45000, priority: 50 },
  { file: "9na.xls",       categoryName: "9na División",     categoryType: "JUVENIL",     year: 2012, monthlyFee: 45000, priority: 40 },
  { file: "2013 Inf.xls",  categoryName: "Infantil 2013",    categoryType: "INFANTIL",    year: 2013, monthlyFee: 35000, priority: 30 },
  { file: "2014 inf.xls",  categoryName: "Infantil 2014",    categoryType: "INFANTIL",    year: 2014, monthlyFee: 35000, priority: 25 },
  { file: "2015 inf.xls",  categoryName: "Infantil 2015",    categoryType: "INFANTIL",    year: 2015, monthlyFee: 30000, priority: 20 },
  { file: "2016 inf.xls",  categoryName: "Infantil 2016",    categoryType: "INFANTIL",    year: 2016, monthlyFee: 30000, priority: 15 },
];

type RawRow = {
  afaId: string;
  fullName: string;
  registrationStatus: string;
  nationality: string;
  birthDate: Date | null;
  age: number;
  level: string;
};

/** Parsea "APELLIDO, NOMBRES" → { lastName, firstName } */
function splitName(full: string): { firstName: string; lastName: string } {
  const trim = full.trim();
  const idx = trim.indexOf(",");
  if (idx < 0) {
    // Caso raro: sin coma. Asumimos último token = apellido.
    const parts = trim.split(/\s+/);
    if (parts.length === 1) return { lastName: parts[0], firstName: "" };
    return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
  }
  const lastName = trim.slice(0, idx).trim();
  const firstName = trim.slice(idx + 1).trim();
  return { firstName: titleCase(firstName), lastName: titleCase(lastName) };
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Parsea "06.05.2004" → Date */
function parseBirth(raw: unknown): Date | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  const s = String(raw).trim();
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) {
    // Excel a veces devuelve serial number
    if (typeof raw === "number") {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(epoch.getTime() + raw * 86400 * 1000);
    }
    return null;
  }
  const [, d, mo, y] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
}

function readPlanilla(filePath: string): RawRow[] {
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return rows
    .map((r) => {
      const afaIdRaw = r["Núm"] ?? r["Num"] ?? r["#"] ?? "";
      const afaId = String(afaIdRaw).trim();
      const fullName = String(r["Nombre"] ?? "").trim();
      const registrationStatus = String(r["Estado (Registro)"] ?? "").trim();
      const nationality = String(r["Nacionalidad"] ?? "Argentina").trim();
      const birthDate = parseBirth(r["Fecha Nac."]);
      const age = Number(r["Edad"] ?? 0);
      const level = String(r["Nivel"] ?? "").trim();
      return { afaId, fullName, registrationStatus, nationality, birthDate, age, level };
    })
    .filter((r) => r.afaId && r.fullName);
}

async function main() {
  console.log("🌱 Importando planillas COMET / AFA — Barrancas FC\n");

  // 1. Verificar que las planillas existen
  const missing: string[] = [];
  for (const p of PLANILLAS) {
    try {
      readFileSync(join(DOWNLOADS, p.file));
    } catch {
      missing.push(p.file);
    }
  }
  if (missing.length) {
    console.error(`❌ Faltan archivos en ${DOWNLOADS}:\n  - ${missing.join("\n  - ")}`);
    process.exit(1);
  }

  // 2. Wipe tabla rasa (mantiene staff)
  console.log("🧹 Limpiando data anterior...");
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.playerNote.deleteMany();
  await prisma.installmentPlan.deleteMany();
  await prisma.document.deleteMany();
  // Desvincular hijos de padres
  await prisma.user.updateMany({
    where: { role: "PADRE" },
    data: {}, // los hijos se borran al borrar players
  });
  await prisma.player.deleteMany();
  await prisma.category.deleteMany();
  // Audit log lo conservamos como rastro histórico
  console.log("✓ Data limpia\n");

  // 3. Asegurar club
  let club = await prisma.club.findFirst();
  if (!club) {
    club = await prisma.club.create({ data: { name: "Barrancas FC" } });
    console.log(`✓ Club creado: ${club.name}`);
  } else {
    console.log(`✓ Club existente: ${club.name}`);
  }

  // 4. Crear categorías
  console.log("\n📋 Creando categorías...");
  const catByName = new Map<string, { id: string; priority: number; type: string; monthlyFee: number }>();
  for (const p of PLANILLAS) {
    const cat = await prisma.category.create({
      data: { name: p.categoryName, type: p.categoryType, year: p.year, clubId: club.id },
    });
    catByName.set(p.categoryName, { id: cat.id, priority: p.priority, type: p.categoryType, monthlyFee: p.monthlyFee });
    console.log(`  ✓ ${p.categoryName} (${p.categoryType}, año ${p.year})`);
  }

  // 5. Leer todas las planillas y agrupar por jugador (afaId)
  console.log("\n📥 Leyendo planillas...");
  type PlayerData = {
    afaId: string;
    fullName: string;
    firstName: string;
    lastName: string;
    birthDate: Date | null;
    nationality: string;
    verified: boolean;
    categories: { name: string; priority: number }[];
  };
  const players = new Map<string, PlayerData>();

  for (const p of PLANILLAS) {
    const rows = readPlanilla(join(DOWNLOADS, p.file));
    console.log(`  📄 ${p.file}: ${rows.length} jugadores`);
    for (const r of rows) {
      const existing = players.get(r.afaId);
      if (existing) {
        existing.categories.push({ name: p.categoryName, priority: p.priority });
        continue;
      }
      const { firstName, lastName } = splitName(r.fullName);
      players.set(r.afaId, {
        afaId: r.afaId,
        fullName: r.fullName,
        firstName,
        lastName,
        birthDate: r.birthDate,
        nationality: r.nationality || "Argentina",
        verified: /VERIFIC/i.test(r.registrationStatus),
        categories: [{ name: p.categoryName, priority: p.priority }],
      });
    }
  }
  console.log(`\n✓ ${players.size} jugadores únicos detectados`);

  // Contar duplicados
  let multiCount = 0;
  for (const p of players.values()) {
    if (p.categories.length > 1) multiCount++;
  }
  console.log(`  ↳ ${multiCount} jugadores en más de una categoría`);

  // 6. Crear jugadores
  console.log("\n🏗️ Creando jugadores en la base...");
  let created = 0;
  let withoutBirth = 0;

  for (const pd of players.values()) {
    if (!pd.birthDate) {
      withoutBirth++;
      // Fallback: usar 1 ene del año mayor de las categorías (mejor que nada)
      const fallbackYear = pd.categories[0]?.name.includes("Infantil")
        ? Number(pd.categories[0].name.split(" ")[1])
        : 2005;
      pd.birthDate = new Date(Date.UTC(fallbackYear, 0, 1));
    }

    // Categoría principal: la de mayor priority
    const sortedCats = [...pd.categories].sort((a, b) => b.priority - a.priority);
    const primaryCatName = sortedCats[0].name;
    const primaryCat = catByName.get(primaryCatName)!;
    const additionalCatIds = sortedCats.slice(1).map((c) => catByName.get(c.name)!.id);

    await prisma.player.create({
      data: {
        firstName: pd.firstName,
        lastName: pd.lastName,
        afaId: pd.afaId,
        afaRegistration: pd.afaId, // legacy
        birthDate: pd.birthDate,
        nationality: pd.nationality,
        status: pd.verified ? "ACTIVE" : "INACTIVE",
        monthlyFee: primaryCat.monthlyFee,
        paymentPlan: primaryCat.type === "PROFESIONAL" ? "ANNUAL" : "MONTHLY",
        categoryId: primaryCat.id,
        additionalCategories: additionalCatIds.length
          ? { connect: additionalCatIds.map((id) => ({ id })) }
          : undefined,
        clubId: club.id,
      },
    });
    created++;
  }

  console.log(`✓ ${created} jugadores creados`);
  if (withoutBirth > 0) {
    console.log(`  ⚠️  ${withoutBirth} jugadores sin fecha de nacimiento parseable (usado fallback)`);
  }

  console.log("\n✅ Importación completa");
  console.log(`   Total: ${created} jugadores en ${PLANILLAS.length} categorías`);
  console.log(`   Multi-categoría: ${multiCount} jugadores`);
}

main()
  .catch((e) => {
    console.error("❌ Import falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
