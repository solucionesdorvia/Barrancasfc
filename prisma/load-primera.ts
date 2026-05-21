import { PrismaClient, PlayerPosition } from "@prisma/client";

const prisma = new PrismaClient();

type RawPlayer = {
  firstName: string;
  lastName: string;
  birth: string; // dd/mm/yyyy
  position: PlayerPosition;
};

const PLAYERS: RawPlayer[] = [
  // Delanteros
  { firstName: "Juan Ignacio", lastName: "Mitre", birth: "24/6/2000", position: "FORWARD" },
  { firstName: "Franco", lastName: "Petrone", birth: "11/7/2004", position: "FORWARD" },
  { firstName: "Brandon", lastName: "Maciel", birth: "3/3/2003", position: "FORWARD" },
  { firstName: "Maximiliano", lastName: "Domínguez Cespedes", birth: "3/8/2004", position: "FORWARD" },
  { firstName: "Thiago", lastName: "Arredondo", birth: "6/2/2004", position: "FORWARD" },
  { firstName: "Luca", lastName: "Ferrucci", birth: "12/5/2006", position: "FORWARD" },
  { firstName: "Julián", lastName: "Grosjean", birth: "25/6/2005", position: "FORWARD" },
  { firstName: "Iván Leonel", lastName: "Leguizamón", birth: "17/10/2002", position: "FORWARD" },
  { firstName: "Miguel Agustín", lastName: "Robles", birth: "3/1/2003", position: "FORWARD" },
  // Centrocampistas
  { firstName: "Miguel", lastName: "Sotelo Sarabia", birth: "15/2/2001", position: "MIDFIELDER" },
  { firstName: "Tomás", lastName: "Chaiman", birth: "22/2/2004", position: "MIDFIELDER" },
  { firstName: "Thiago", lastName: "Luna", birth: "1/1/2000", position: "MIDFIELDER" },
  { firstName: "Cristian David", lastName: "Moreira", birth: "19/12/2004", position: "MIDFIELDER" },
  { firstName: "Lucas Ezequiel", lastName: "González", birth: "26/2/2003", position: "MIDFIELDER" },
  { firstName: "Luciano", lastName: "Guitian", birth: "23/8/2001", position: "MIDFIELDER" },
  { firstName: "Luca Nahuel", lastName: "Luna", birth: "20/10/2004", position: "MIDFIELDER" },
  { firstName: "Juan Ignacio", lastName: "Paz", birth: "7/3/2002", position: "MIDFIELDER" },
  { firstName: "Ioannis", lastName: "Sosa", birth: "30/4/2005", position: "MIDFIELDER" },
  { firstName: "Rodrigo", lastName: "Villamayor", birth: "2/4/2003", position: "MIDFIELDER" },
  // Defensas
  { firstName: "Juan Martín", lastName: "Segon", birth: "4/3/2003", position: "DEFENDER" },
  { firstName: "Emanuel", lastName: "Castro", birth: "5/4/2000", position: "DEFENDER" },
  { firstName: "Joaquín", lastName: "Garrido", birth: "28/4/2003", position: "DEFENDER" },
  { firstName: "Francisco", lastName: "Sosa", birth: "24/7/2003", position: "DEFENDER" },
  { firstName: "Tas Sahir", lastName: "Ali", birth: "6/5/2004", position: "DEFENDER" },
  { firstName: "Gastón Leonel", lastName: "Caceres", birth: "25/9/2000", position: "DEFENDER" },
  { firstName: "Alan Gabriel", lastName: "Pazos", birth: "25/7/2004", position: "DEFENDER" },
  { firstName: "Joaquin", lastName: "Soñora", birth: "2/5/2004", position: "DEFENDER" },
  // Arqueros
  { firstName: "Agustín", lastName: "Scilingo", birth: "17/4/2003", position: "GOALKEEPER" },
  { firstName: "Iván", lastName: "Romero", birth: "5/5/2003", position: "GOALKEEPER" },
  { firstName: "Gonzalo", lastName: "Moreno", birth: "26/7/2003", position: "GOALKEEPER" },
];

function parseDate(s: string): Date {
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d);
}

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`;
}

// DNI determinístico (no aleatorio) basado en nombre, así re-runs no chocan
function generateDni(p: RawPlayer): string {
  // Hash simple del nombre + apellido + fecha
  const seed = `${p.firstName}${p.lastName}${p.birth}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // DNI entre 25M y 45M
  const dni = 25_000_000 + (Math.abs(hash) % 20_000_000);
  return String(dni);
}

async function main() {
  console.log("📋 Cargando plantel de Primera División...");

  const club = await prisma.club.findFirst({ where: { name: "Barrancas FC" } });
  if (!club) throw new Error("No se encontró el club. Corré npm run db:seed primero.");

  // Crear o reusar la categoría
  let category = await prisma.category.findFirst({
    where: { name: "Primera División", clubId: club.id },
  });

  if (category) {
    console.log(`✓ Categoría "Primera División" ya existe — limpiando jugadores previos`);
    await prisma.player.deleteMany({ where: { categoryId: category.id } });
  } else {
    category = await prisma.category.create({
      data: {
        name: "Primera División",
        type: "PROFESIONAL",
        year: new Date().getFullYear(),
        clubId: club.id,
      },
    });
    console.log(`✓ Categoría "Primera División" creada`);
  }

  // Admin user para registrar el audit
  const admin = await prisma.user.findFirst({ where: { email: "admin@barrancas.com" } });

  let count = 0;
  for (const p of PLAYERS) {
    const fullName = `${p.firstName} ${p.lastName}`;
    const dni = generateDni(p);

    // Si por casualidad ya existe el DNI (raro pero posible), lo borramos
    await prisma.player.deleteMany({ where: { dni } });

    const player = await prisma.player.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        dni,
        birthDate: parseDate(p.birth),
        photo: avatarUrl(fullName),
        nationality: "Argentina",
        position: p.position,
        status: "ACTIVE",
        scholarshipType: "NONE",
        paymentPlan: "SCHOLARSHIP", // jugadores de primera no pagan cuota
        monthlyFee: 0,
        categoryId: category.id,
        clubId: club.id,
      },
    });
    count++;

    if (admin) {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          entityType: "Player",
          entityId: player.id,
          action: "PLAYER_CREATED",
          changes: {
            name: fullName,
            category: "Primera División",
            position: p.position,
            source: "import-primera",
          },
        },
      });
    }
  }

  console.log(`✅ ${count} jugadores cargados en Primera División`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
