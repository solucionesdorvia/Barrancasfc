import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuditTimeline } from "@/components/admin/audit-timeline";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const userIds = Array.from(new Set(logs.map((l) => l.userId)));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const logsWithUser = logs.map((l) => ({ ...l, user: userMap.get(l.userId) ?? null }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Registro de todas las acciones del sistema · {logs.length} últimos eventos
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bitácora global</CardTitle>
          <CardDescription>
            Cada acción queda registrada con usuario, fecha y detalle.
            Para ver el historial de un usuario en particular, andá a <Link href="/admin/users" className="underline">Usuarios</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline logs={logsWithUser} showUser />
        </CardContent>
      </Card>
    </div>
  );
}
