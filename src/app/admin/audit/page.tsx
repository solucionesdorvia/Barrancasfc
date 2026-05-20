import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { AuditFilters } from "@/components/admin/audit-filters";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { userId?: string; action?: string; range?: string };
}) {
  const where: Prisma.AuditLogWhereInput = {};
  if (searchParams.userId && searchParams.userId !== "all") where.userId = searchParams.userId;
  if (searchParams.action && searchParams.action !== "all") where.action = searchParams.action;
  if (searchParams.range && searchParams.range !== "all") {
    const days = Number(searchParams.range) || 30;
    where.createdAt = { gte: new Date(Date.now() - days * 24 * 3600 * 1000) };
  } else if (!searchParams.range) {
    where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) };
  }

  const [logs, staff] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "PROFESOR"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  const userIds = Array.from(new Set(logs.map((l) => l.userId)));
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));
  const logsWithUser = logs.map((l) => ({ ...l, user: userMap.get(l.userId) ?? null }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registro de actividad"
        description={`${logs.length} ${logs.length === 1 ? "acción registrada" : "acciones registradas"}`}
      />

      <Card>
        <CardContent className="py-4">
          <AuditFilters users={staff} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos</CardTitle>
          <CardDescription>
            Cada acción queda registrada con el usuario, la fecha y el detalle de lo modificado.
            Para ver la actividad de un usuario específico, ingresá a{" "}
            <Link href="/admin/users" className="underline underline-offset-2">Staff</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline logs={logsWithUser} showUser />
        </CardContent>
      </Card>
    </div>
  );
}
