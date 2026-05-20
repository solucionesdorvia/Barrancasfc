import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Calendar, Activity, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { initials, formatDate, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESOR: "Profesor",
  PADRE: "Padre",
};

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const [user, logs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  if (!user) notFound();

  // Stats agregados por acción
  const actionCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.action] = (acc[l.action] ?? 0) + 1;
    return acc;
  }, {});
  const mostFrequent = Object.entries(actionCounts).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/admin/users"><ArrowLeft className="h-4 w-4" /> Volver al staff</Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
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
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3 w-3" /> Alta {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Acciones registradas</p>
            <p className="text-3xl font-bold mt-1 tabular-nums">{logs.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Histórico completo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Última actividad</p>
            <p className="text-lg font-semibold mt-1">
              {logs[0] ? formatRelative(logs[0].createdAt) : "Sin actividad"}
            </p>
            {logs[0] && <p className="text-xs text-muted-foreground mt-1">{formatDate(logs[0].createdAt)}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Acción frecuente</p>
            <p className="text-sm font-semibold mt-1 line-clamp-1">
              {mostFrequent ? <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" />{prettyAction(mostFrequent[0])}</span> : "—"}
            </p>
            {mostFrequent && <p className="text-xs text-muted-foreground mt-1">{mostFrequent[1]} veces</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Actividad del usuario
          </CardTitle>
          <CardDescription>
            Acciones realizadas por {user.name}, ordenadas de la más reciente a la más antigua.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}

function prettyAction(a: string) {
  const map: Record<string, string> = {
    PAYMENT_MARKED_PAID: "Marcar pagos",
    PAYMENTS_GENERATED: "Generar cuotas",
    PLAYERS_IMPORTED: "Importar jugadores",
    PLAYER_CATEGORY_CHANGED: "Cambiar categoría",
    PLAYER_STATUS_CHANGED: "Cambiar estado",
    PLAYER_FEE_UPDATED: "Editar cuotas",
    ATTENDANCE_RECORDED: "Tomar asistencia",
    DOCUMENT_UPLOADED: "Subir documentos",
    FITNESS_APPROVED: "Cargar aptos",
    NOTICE_CREATED: "Publicar avisos",
  };
  return map[a] ?? a;
}
