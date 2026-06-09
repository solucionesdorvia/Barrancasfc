import Link from "next/link";
import { AlertTriangle, UserX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { absenceStreak, PROLONGED_ABSENCE_THRESHOLD } from "@/lib/attendance-streak";
import { initials, fullName, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  await requireRole("ADMIN");

  // Traemos jugadores activos con sus últimas asistencias para calcular racha
  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  const players = await prisma.player.findMany({
    where: { status: { in: ["ACTIVE", "INJURED"] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      category: { select: { name: true, type: true } },
      attendances: {
        where: { date: { gte: since } },
        select: { date: true, present: true },
      },
    },
  });

  // Calcular racha por jugador. Solo nos importan los que tienen al menos
  // PROLONGED_ABSENCE_THRESHOLD ausencias consecutivas.
  const withStreak = players
    .map((p) => {
      const { streak, lastSeen } = absenceStreak(p.attendances, { sinceDays: 60 });
      return { ...p, streak, lastSeen };
    })
    .filter((p) => p.streak >= PROLONGED_ABSENCE_THRESHOLD)
    .sort((a, b) => b.streak - a.streak);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alertas"
        description={`Jugadores con ${PROLONGED_ABSENCE_THRESHOLD}+ ausencias consecutivas a entrenamientos`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-600" />
            Ausencias prolongadas
          </CardTitle>
          <CardDescription>
            Detectados automáticamente desde la asistencia de los últimos 60 días. Útil para
            contactar a los padres y entender si el chico tiene un problema o dejó de venir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withStreak.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="Sin alertas activas"
              description="Todos los chicos vienen regularmente o no hay datos suficientes."
              bare
            />
          ) : (
            <div className="space-y-2">
              {withStreak.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/players/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.photo ?? undefined} />
                    <AvatarFallback>{initials(fullName(p.firstName, p.lastName))}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.category.name}
                      {p.lastSeen
                        ? ` · última vez visto ${formatRelative(p.lastSeen)}`
                        : " · sin asistencias previas"}
                    </p>
                  </div>
                  <Badge variant={p.streak >= 5 ? "danger" : "warning"} className="shrink-0">
                    {p.streak} faltas
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
