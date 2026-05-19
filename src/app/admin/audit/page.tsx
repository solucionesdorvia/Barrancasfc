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
        <h1 className="text-2xl font-bold tracking-tight">Registro de actividad</h1>
        <p className="text-sm text-muted-foreground">
          Movimientos del sistema · {logs.length} acciones registradas
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas acciones</CardTitle>
          <CardDescription>
            Cada movimiento queda registrado con el usuario, la fecha y el detalle de lo modificado.
            Para ver la actividad de un usuario específico, ingresá a <Link href="/admin/users" className="underline">Staff</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline logs={logsWithUser} showUser />
        </CardContent>
      </Card>
    </div>
  );
}
