import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Calendar, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { initials, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESOR: "Profesor",
  PADRE: "Padre",
};

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, logs] = await Promise.all([
    prisma.user.findUnique({ where: { id: params.id } }),
    prisma.auditLog.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/users"><ArrowLeft className="h-4 w-4" /> Volver al staff</Link>
      </Button>

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-xl">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {ROLE_LABEL[user.role]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Mail className="h-3 w-3" /> {user.email}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Calendar className="h-3 w-3" /> Alta: {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de acciones</p>
            <p className="text-3xl font-bold mt-1">{logs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Última actividad</p>
            <p className="text-lg font-semibold mt-1">{logs[0] ? formatDate(logs[0].createdAt) : "Sin actividad"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
            <p className="text-lg font-semibold mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Activo
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Historial de actividad
          </CardTitle>
          <CardDescription>
            Todas las acciones que {user.name} realizó en el sistema, ordenadas de más reciente a más antigua.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
