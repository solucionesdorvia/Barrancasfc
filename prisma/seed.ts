import { PrismaClient, CategoryType, PlayerStatus, ScholarshipType, PaymentPlan, PaymentStatus, DocumentType, Role } from "@prisma/client";
import { faker } from "@faker-js/faker/locale/es";

const prisma = new PrismaClient();

const HEALTH_INSURANCES = ["OSDE", "Swiss Medical", "IOMA", "Galeno", "OSPe", "Medifé", "Sancor Salud", "Ninguna"];
const NEIGHBORHOODS = ["Barrancas de Belgrano", "Belgrano R", "Núñez", "Colegiales", "Saavedra", "Coghlan", "Villa Urquiza"];
const SCHOOLS = ["ENAM", "Northlands", "Don Bosco", "San Ladislao", "Escuela 19 DE 10", "Cardenal Newman", "Escuela Argentina Modelo"];

const CATEGORIES: { name: string; type: CategoryType; year: number }[] = [
  { name: "Infantil 2014", type: "INFANTIL", year: 2014 },
  { name: "Infantil 2013", type: "INFANTIL", year: 2013 },
  { name: "Infantil 2012", type: "INFANTIL", year: 2012 },
  { name: "Infantil 2011", type: "INFANTIL", year: 2011 },
  { name: "Infantil 2010", type: "INFANTIL", year: 2010 },
  { name: "Juvenil 2008", type: "JUVENIL", year: 2008 },
  { name: "Juvenil 2007", type: "JUVENIL", year: 2007 },
  { name: "Juvenil 2005", type: "JUVENIL", year: 2005 },
];

const FEE_BY_CATEGORY: Record<string, number> = {
  INFANTIL: 35000,
  JUVENIL: 45000,
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function randomDni(): string {
  return String(faker.number.int({ min: 25_000_000, max: 55_000_000 }));
}

function randomBirth(year: number): Date {
  return faker.date.between({
    from: new Date(year, 0, 1),
    to: new Date(year, 11, 31),
  });
}

async function main() {
  console.log("🌱 Seeding Barrancas FC...");

  // Wipe (idempotente para re-runs)
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.club.deleteMany();
  await prisma.auditLog.deleteMany();

  // Club
  const club = await prisma.club.create({
    data: { name: "Barrancas FC" },
  });
  console.log(`✓ Club: ${club.name}`);

  // Categorías
  const categories = await Promise.all(
    CATEGORIES.map((c) =>
      prisma.category.create({
        data: { ...c, clubId: club.id },
      })
    )
  );
  console.log(`✓ ${categories.length} categorías`);

  // Avisos del club
  await prisma.notice.createMany({
    data: [
      {
        title: "Cierre de inscripción para el torneo de invierno",
        body: "Recordamos que las inscripciones cierran el viernes 30. Pasen por secretaría o avisen a su coordinador.",
      },
      {
        title: "Apto físico — vencimientos de junio",
        body: "Si tu apto físico vence en junio, podés renovarlo con el Dr. Fernández los martes y jueves de 17 a 19hs.",
      },
      {
        title: "Asado de fin de torneo",
        body: "Sábado 28 a las 13hs en la sede. Los esperamos a todas las familias.",
      },
    ],
  });
  console.log(`✓ 3 avisos`);

  // Jugadores: 10 por categoría = 80
  const playersPerCategory = 10;
  const allPlayers = [];

  for (const category of categories) {
    for (let i = 0; i < playersPerCategory; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;

      const isScholarship = Math.random() < 0.15;
      const scholarshipType: ScholarshipType = isScholarship
        ? Math.random() < 0.5 ? "FULL" : "PARTIAL_50"
        : "NONE";
      const scholarshipPercent = scholarshipType === "FULL" ? 100 : scholarshipType === "PARTIAL_50" ? 50 : null;

      const baseFee = FEE_BY_CATEGORY[category.type];
      const monthlyFee = scholarshipType === "FULL"
        ? 0
        : scholarshipType === "PARTIAL_50"
          ? baseFee * 0.5
          : baseFee;

      const status: PlayerStatus =
        Math.random() < 0.85 ? "ACTIVE" : Math.random() < 0.5 ? "INJURED" : "INACTIVE";

      const fitnessExpiry = faker.date.between({
        from: new Date(),
        to: faker.date.future({ years: 1 }),
      });
      // 15% con apto vencido o por vencer en 30 días
      const expiryAdjusted = Math.random() < 0.15
        ? faker.date.between({ from: new Date(Date.now() - 30 * 24 * 3600 * 1000), to: new Date(Date.now() + 30 * 24 * 3600 * 1000) })
        : fitnessExpiry;

      const dni = randomDni();
      const player = await prisma.player.create({
        data: {
          firstName,
          lastName,
          dni,
          birthDate: randomBirth(category.year),
          photo: avatarUrl(fullName + dni),
          nationality: "Argentina",
          address: `${faker.location.street()} ${faker.number.int({ min: 100, max: 5000 })}, ${pick(NEIGHBORHOODS)}`,
          emergencyContact: `${faker.person.fullName()} - ${faker.phone.number()}`,
          schoolName: pick(SCHOOLS),
          schoolSchedule: { turno: pick(["mañana", "tarde", "doble"]) },
          status,
          scholarshipType,
          scholarshipPercent,
          paymentPlan: scholarshipType === "FULL" ? "SCHOLARSHIP" : "MONTHLY",
          monthlyFee,
          healthInsurance: pick(HEALTH_INSURANCES),
          healthInsuranceNumber: faker.string.numeric(10),
          fitnessExpiry: expiryAdjusted,
          afaRegistration: `AFA-${faker.string.numeric(6)}`,
          categoryId: category.id,
          clubId: club.id,
        },
      });
      allPlayers.push(player);
    }
  }
  console.log(`✓ ${allPlayers.length} jugadores`);

  // Usuarios demo (linkean por email a Clerk)
  const profeCategory = categories.find((c) => c.name === "Infantil 2012")!;
  const padreChild1 = allPlayers.find((p) => p.categoryId === profeCategory.id)!;
  const juvenilCategory = categories.find((c) => c.name === "Juvenil 2008")!;
  const padreChild2 = allPlayers.find((p) => p.categoryId === juvenilCategory.id)!;

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@barrancas.com",
      name: "Manuela",
      role: "ADMIN",
      clubId: club.id,
    },
  });

  const profeUser = await prisma.user.create({
    data: {
      email: "profe@barrancas.com",
      name: "Diego",
      role: "PROFESOR",
      clubId: club.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "padre@barrancas.com",
      name: "Martín",
      role: "PADRE",
      clubId: club.id,
      children: {
        connect: [{ id: padreChild1.id }, { id: padreChild2.id }],
      },
    },
  });
  console.log(`✓ 3 usuarios demo (admin, profesor, padre con 2 hijos)`);

  // Pagos: últimos 6 meses (incluyendo el actual)
  const now = new Date();
  let paymentsCount = 0;
  let overdueTotal = 0;
  const paidPayments: { id: string; playerId: string; amount: number; month: number; year: number; method: string; paidAt: Date }[] = [];

  for (const player of allPlayers) {
    if (Number(player.monthlyFee) === 0) continue; // becados full no tienen cuotas

    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const dueDate = new Date(year, month - 1, 10);

      let status: PaymentStatus;
      let paidAt: Date | null = null;
      let paymentMethod: string | null = null;

      const r = Math.random();
      if (monthsAgo === 0) {
        // Mes actual: 50% pendientes, 40% pagados, 10% morosos
        if (r < 0.5) { status = "PENDING"; }
        else if (r < 0.9) { status = "PAID"; paidAt = faker.date.recent({ days: 10 }); paymentMethod = pick(["MercadoPago", "Transferencia", "Efectivo"]); }
        else { status = "OVERDUE"; overdueTotal++; }
      } else {
        // Meses pasados: 75% pagados, 15% morosos, 10% en plan
        if (r < 0.75) { status = "PAID"; paidAt = faker.date.between({ from: dueDate, to: new Date(year, month, 5) }); paymentMethod = pick(["MercadoPago", "Transferencia", "Efectivo"]); }
        else if (r < 0.9) { status = "OVERDUE"; overdueTotal++; }
        else { status = "IN_PLAN"; }
      }

      const payment = await prisma.payment.create({
        data: {
          playerId: player.id,
          amount: player.monthlyFee,
          month,
          year,
          dueDate,
          status,
          paidAt,
          paymentMethod,
        },
      });
      if (status === "PAID" && paidAt) {
        paidPayments.push({ id: payment.id, playerId: player.id, amount: Number(player.monthlyFee), month, year, method: paymentMethod!, paidAt });
      }
      paymentsCount++;
    }
  }
  console.log(`✓ ${paymentsCount} pagos generados (${overdueTotal} morosos)`);

  // Asistencia: últimos 30 días para Infantil 2012 y Juvenil 2008
  const trackedCategories = [profeCategory.id, juvenilCategory.id];
  let attendanceCount = 0;
  // Agrupado por (categoryId + fecha) para luego generar 1 log de "ATTENDANCE_RECORDED" por sesión
  const attendanceSessions = new Map<string, { categoryId: string; date: Date; total: number; present: number }>();

  for (const player of allPlayers.filter((p) => trackedCategories.includes(p.categoryId))) {
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(0, 0, 0, 0);
      const dow = date.getDay();
      if (![1, 3, 5].includes(dow)) continue;
      const present = Math.random() < 0.85;
      await prisma.attendance.create({
        data: { playerId: player.id, date, present },
      });
      attendanceCount++;
      const key = `${player.categoryId}_${date.toISOString()}`;
      const s = attendanceSessions.get(key) ?? { categoryId: player.categoryId, date, total: 0, present: 0 };
      s.total++;
      if (present) s.present++;
      attendanceSessions.set(key, s);
    }
  }
  console.log(`✓ ${attendanceCount} registros de asistencia`);

  // Documentos: 5 jugadores con docs
  const createdDocs: { id: string; playerId: string; type: string; name: string }[] = [];
  for (const player of allPlayers.slice(0, 5)) {
    const d1 = await prisma.document.create({
      data: {
        playerId: player.id,
        type: "DNI" as DocumentType,
        name: `DNI - ${player.firstName} ${player.lastName}`,
        url: "https://placehold.co/600x400/png?text=DNI",
        uploadedBy: "admin@barrancas.com",
      },
    });
    const d2 = await prisma.document.create({
      data: {
        playerId: player.id,
        type: "MEDICAL" as DocumentType,
        name: `Apto físico - ${player.firstName} ${player.lastName}`,
        url: "https://placehold.co/600x400/png?text=Apto+Fisico",
        uploadedBy: "admin@barrancas.com",
      },
    });
    createdDocs.push({ id: d1.id, playerId: player.id, type: "DNI", name: d1.name });
    createdDocs.push({ id: d2.id, playerId: player.id, type: "MEDICAL", name: d2.name });
  }
  console.log(`✓ 10 documentos`);

  // === Actividad: registramos los movimientos que normalmente generarían los usuarios ===
  let auditCount = 0;

  // 1. Importación inicial de jugadores (hace ~60 días, Manuela)
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      entityType: "System",
      entityId: "import",
      action: "PLAYERS_IMPORTED",
      changes: { inserted: allPlayers.length, errorCount: 0, note: "Carga inicial del plantel" },
      createdAt: faker.date.recent({ days: 60, refDate: new Date(now.getTime() - 50 * 24 * 3600 * 1000) }),
    },
  });
  auditCount++;

  // 2. Generación mensual de cuotas (1 por mes, los días 1 de cada uno, por Manuela)
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 9, 30, 0);
    const count = allPlayers.filter((p) => Number(p.monthlyFee) > 0).length;
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        entityType: "System",
        entityId: "payments",
        action: "PAYMENTS_GENERATED",
        changes: { month: d.getMonth() + 1, year: d.getFullYear(), count },
        createdAt: d,
      },
    });
    auditCount++;
  }

  // 3. Pagos cobrados (muestra de hasta 40 logs, Manuela los marcó manualmente)
  const sampledPaid = paidPayments.sort(() => 0.5 - Math.random()).slice(0, 40);
  for (const p of sampledPaid) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        entityType: "Payment",
        entityId: p.id,
        action: "PAYMENT_MARKED_PAID",
        changes: { playerId: p.playerId, amount: p.amount, month: p.month, year: p.year, method: p.method, previousStatus: "PENDING" },
        createdAt: p.paidAt,
      },
    });
    auditCount++;
  }

  // 4. Cambios de categoría (5 jugadores que ascendieron, Manuela los movió)
  const categoryChanges = allPlayers.slice(0, 5);
  for (let i = 0; i < categoryChanges.length; i++) {
    const player = categoryChanges[i];
    const otherCat = categories.find((c) => c.id !== player.categoryId && c.type === "INFANTIL")!;
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        entityType: "Player",
        entityId: player.id,
        action: "PLAYER_CATEGORY_CHANGED",
        changes: {
          from: { id: otherCat.id, name: otherCat.name },
          to: { id: player.categoryId, name: categories.find((c) => c.id === player.categoryId)!.name },
          note: "Ascenso de categoría",
        },
        createdAt: faker.date.recent({ days: 30 - i * 4 }),
      },
    });
    auditCount++;
  }

  // 5. Asistencias registradas (1 log por sesión, Diego el profesor)
  for (const session of attendanceSessions.values()) {
    // Solo Infantil 2012 (la del profe Diego)
    if (session.categoryId !== profeCategory.id) continue;
    await prisma.auditLog.create({
      data: {
        userId: profeUser.id,
        entityType: "Attendance",
        entityId: session.categoryId,
        action: "ATTENDANCE_RECORDED",
        changes: {
          date: session.date.toISOString(),
          total: session.total,
          present: session.present,
          absent: session.total - session.present,
        },
        createdAt: new Date(session.date.getTime() + 19 * 3600 * 1000), // ~19hs del día
      },
    });
    auditCount++;
  }

  // 6. Documentos subidos (Manuela cargó los iniciales)
  for (const d of createdDocs) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        entityType: "Document",
        entityId: d.id,
        action: "DOCUMENT_UPLOADED",
        changes: { playerId: d.playerId, type: d.type, name: d.name },
        createdAt: faker.date.recent({ days: 45 }),
      },
    });
    auditCount++;
  }

  // 7. Aprobaciones de apto físico (3 recientes, Manuela)
  for (let i = 0; i < 3; i++) {
    const player = allPlayers[i + 5];
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        entityType: "Player",
        entityId: player.id,
        action: "FITNESS_APPROVED",
        changes: { playerId: player.id, expiry: player.fitnessExpiry?.toISOString() ?? null, note: "Apto físico cargado y aprobado" },
        createdAt: faker.date.recent({ days: 15 - i * 3 }),
      },
    });
    auditCount++;
  }
  console.log(`✓ ${auditCount} movimientos en actividad`);

  console.log("\n✅ Seed completo");
  console.log("Usuarios demo (creálos en Clerk con estos emails):");
  console.log("  · admin@barrancas.com / Valen050203!");
  console.log("  · profe@barrancas.com / Valen050203!");
  console.log("  · padre@barrancas.com / Valen050203!");
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
