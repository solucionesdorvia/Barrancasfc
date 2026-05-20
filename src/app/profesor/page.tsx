import Link from "next/link";
import { Users, ClipboardCheck, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceForm } from "@/components/profesor/attendance-form";
import { initials, fullName, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Para el MVP el profesor está hardcodeado a "Infantil 2012". En el sistema final
// viene de una relación profesor↔categorías.
const PROFE_CATEGORY_NAME = "Infantil 2012";

function parseDate(input?: string): Date {
  if (!input) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // Soporta YYYY-MM-DD
  const [y, m, d] = input.split("-").map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const dt = new Date(input);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export default async function ProfesorPage({ searchParams }: { searchParams: { fecha?: string } }) {
  const user = await requireRole(["PROFESOR", "ADMIN"]);

  const category = await prisma.category.findFirst({ where: { name: PROFE_CATEGORY_NAME } });
  if (!category) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Users}
            title="No tenés categorías asignadas"
            description="Pedile al admin que te asigne al menos una categoría para poder tomar asistencia."
            bare
          />
        </CardContent>
      </Card>
    );
  }

  const selectedDate = parseDate(searchParams.fecha);
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const players = await prisma.player.findMany({
    where: { categoryId: category.id, status: { in: ["ACTIVE", "INJURED"] } },
    orderBy: { lastName: "asc" },
    include: {
      attendances: {
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      },
    },
  });

  const dayAttendance = await prisma.attendance.findMany({
    where: { playerId: { in: players.map((p) => p.id) }, date: selectedDate },
  });
  const initial: Record<string, boolean> = {};
  for (const a of dayAttendance) initial[a.playerId] = a.present;

  return (
    <div className="space-y-5">
      <PageHeader
        title={category.name}
        description={`${players.length} jugadores · Hola, ${user.name}`}
      />

      <Tabs defaultValue="hoy">
        <TabsList>
          <TabsTrigger value="hoy">{isToday ? "Hoy" : "Asistencia"}</TabsTrigger>
          <TabsTrigger value="historial">Histórico (30 días)</TabsTrigger>
        </TabsList>

        <TabsContent value="hoy" className="space-y-3">
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="fecha" className="text-sm font-medium">Día</label>
              <form action="" className="flex items-center gap-2 ml-auto" method="get">
                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  defaultValue={selectedDate.toISOString().slice(0, 10)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="text-sm border rounded-md px-2 py-1.5 bg-background"
                />
                <button type="submit" className="text-xs font-medium text-barrancas-red hover:underline">
                  Cambiar
                </button>
              </form>
            </CardContent>
          </Card>
          <AttendanceForm
            players={players.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, photo: p.photo }))}
            date={selectedDate}
            initial={initial}
            categoryId={category.id}
          />
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> Asistencia últimos 30 días
              </CardTitle>
              <CardDescription>Promedio por jugador, ordenado de mayor a menor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {players
                .map((p) => {
                  const total = p.attendances.length;
                  const present = p.attendances.filter((a) => a.present).length;
                  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                  return { ...p, pct, total, present };
                })
                .sort((a, b) => b.pct - a.pct)
                .map((p) => (
                  <Link key={p.id} href={`/admin/players/${p.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.photo ?? undefined} />
                      <AvatarFallback className="text-xs">{initials(fullName(p.firstName, p.lastName))}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.firstName} {p.lastName}</p>
                      <div className="h-1.5 w-full bg-muted-foreground/10 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all ${p.pct >= 80 ? "bg-emerald-500" : p.pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className={`text-sm font-semibold ${p.pct >= 80 ? "text-emerald-600" : p.pct >= 60 ? "text-amber-600" : p.total === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                        {p.total > 0 ? `${p.pct}%` : "s/d"}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{p.present}/{p.total}</p>
                    </div>
                  </Link>
                ))}
              {players.length === 0 && (
                <EmptyState icon={Users} title="Sin jugadores en la categoría" bare />
              )}
              <p className="text-xs text-muted-foreground text-center pt-2">Última actualización: {formatDate(new Date())}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
