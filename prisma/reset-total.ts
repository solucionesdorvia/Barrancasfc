/**
 * Reset total de la DB:
 * - Borra todo el contenido transaccional (notices, events, tasks, invitations, audit).
 * - Borra todos los Users excepto SUPERADMIN.
 * - Borra los mismos users de Clerk vía API para evitar zombies.
 * - Después corré `prisma/import-comet.ts` para repoblar el padrón.
 *
 * Uso: npx tsx prisma/reset-total.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLERK_KEY = process.env.CLERK_SECRET_KEY;

async function deleteClerkUser(clerkId: string): Promise<boolean> {
  if (!CLERK_KEY) return false;
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CLERK_KEY}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("=== PRE-CLEAN: tablas que import-comet no toca ===");
  const auditDel = await prisma.auditLog.deleteMany();
  console.log(`  AuditLog: ${auditDel.count}`);
  const voteDel = await prisma.noticeVote.deleteMany();
  console.log(`  NoticeVote: ${voteDel.count}`);
  const noticeDel = await prisma.notice.deleteMany();
  console.log(`  Notice: ${noticeDel.count}`);
  const taskDel = await prisma.staffTask.deleteMany();
  console.log(`  StaffTask: ${taskDel.count}`);
  // Attendance se borra acá porque tiene FK a Event y queremos drop Event después
  const attDel = await prisma.attendance.deleteMany();
  console.log(`  Attendance: ${attDel.count}`);
  const eventDel = await prisma.event.deleteMany();
  console.log(`  Event: ${eventDel.count}`);
  const invDel = await prisma.invitation.deleteMany();
  console.log(`  Invitation: ${invDel.count}`);

  console.log("\n=== DROP USERS (excepto SUPERADMIN) ===");
  const toDelete = await prisma.user.findMany({
    where: { role: { not: "SUPERADMIN" } },
    select: { id: true, email: true, role: true, clerkId: true },
  });
  console.log(`  ${toDelete.length} users a eliminar:`);

  let clerkOk = 0, clerkFail = 0;
  for (const u of toDelete) {
    const ok = u.clerkId ? await deleteClerkUser(u.clerkId) : false;
    if (ok) clerkOk++;
    else if (u.clerkId) clerkFail++;
    console.log(`    ${ok ? "✓" : (u.clerkId ? "✗" : "·")} ${u.email.padEnd(40)} [${u.role}] clerk:${ok ? "deleted" : (u.clerkId ? "failed" : "no-id")}`);
  }
  console.log(`  Clerk: ${clerkOk} borrados / ${clerkFail} fallos`);

  // Desvincular children del SUPERADMIN si tenía
  await prisma.user.updateMany({
    where: { role: "SUPERADMIN" },
    data: { /* no children relation directa, queda como está */ },
  });

  const dbUserDel = await prisma.user.deleteMany({ where: { role: { not: "SUPERADMIN" } } });
  console.log(`  DB User: ${dbUserDel.count} borrados`);

  console.log("\n=== ESTADO POST-RESET ===");
  const [u, p, c, pay, ev, n] = await Promise.all([
    prisma.user.count(),
    prisma.player.count(),
    prisma.category.count(),
    prisma.payment.count(),
    prisma.event.count(),
    prisma.notice.count(),
  ]);
  console.log(`  Users: ${u} (solo SUPERADMIN debería quedar)`);
  console.log(`  Players: ${p} (será dropeado y re-importado por import-comet)`);
  console.log(`  Categories: ${c} (idem)`);
  console.log(`  Payments: ${pay}  |  Events: ${ev}  |  Notices: ${n}`);
  console.log("\nAhora corré:  npx tsx prisma/import-comet.ts");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
