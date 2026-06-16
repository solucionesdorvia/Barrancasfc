import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AttendanceForm } from "@/components/profesor/attendance-form";
import { ProfesorDatePicker } from "@/components/profesor/date-picker";
import { initials, fullName, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

// Fallback para usuarios viejos que no tienen categorías asignadas (pre-feature
// de invitaciones). El sistema final ya viene con categorías reales.
const FALLBACK_CATEGORY_NAME = "Infantil 2012";

function parseDate(input?: string): Date {
  if (!input) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [y, m, d] = input.split("-").map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const dt = new Date(input);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export default async function ProfesorPage({
  searchParams,
}: {
  searchParams: { fecha?: string; categoria?: string };
}) {
  const user = await requireRole(["PROFESOR", "ADMIN"]);
  if (user.role === "PROFESOR" && !user.profileCompleted) {
    redirect("/profesor/onboarding");
  }

  // Categorías asignadas al profesor. Si no tiene ninguna, caemos al fallback.
  let categories = (user.assignedCategories ?? []) as { id: string; name: string }[];
  if (categories.length === 0) {
    const fallback = await prisma.category.findFirst({ where: { name: FALLBACK_CATEGORY_NAME } });
    if (fallback) categories = [fallback];
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={Users}
            title="No tenés categorías asignadas"
            description="Pedile al administrador que te asigne al menos una categoría desde Staff → Nueva invitación."
            bare
          />
        </CardContent>
      </Card>
    );
  }

  // Elegir categoría activa (query string > primera de la lista)
  const activeId = searchParams.categoria && categories.some((c) => c.id === searchParams.categoria)
    ? searchParams.categoria
    : categories[0].id;
  const category = categories.find((c) => c.id === activeId)!;

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

  const playerIds = players.map((p) => p.id);

  const [dayAttendance, trainingDateRows] = await Promise.all([
    prisma.attendance.findMany({
      where: { playerId: { in: playerIds }, date: selectedDate },
    }),
    // Fechas distintas con al menos una asistencia tomada en los últimos 90
    // días — el date-picker las usa para los botones "anterior/siguiente"
    // y para sugerir la más cercana si la fecha elegida no tuvo entrenamiento.
    prisma.attendance.findMany({
      where: {
        playerId: { in: playerIds },
        date: { gte: new Date(Date.now() - 90 * 24 * 3600 * 1000) },
      },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
    }),
  ]);
  const initial: Record<string, boolean> = {};
  for (const a of dayAttendance) initial[a.playerId] = a.present;

  const trainingDates = trainingDateRows.map((r) => r.date.toISOString().slice(0, 10));
  const selectedDateIso = selectedDate.toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <PageHeader
        title={category.name}
        description={`${players.length} jugadores · Hola, ${user.name}`}
      />

      {/* Selector de categoría si tiene varias */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map((c) => {
            const isActive = c.id === activeId;
            return (
              <Link
                key={c.id}
                href={`/profesor?categoria=${c.id}${searchParams.fecha ? `&fecha=${searchParams.fecha}` : ""}`}
                className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-barrancas-red text-white" : "bg-background border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      )}

      <Tabs defaultValue="hoy">
        <TabsList>
          <TabsTrigger value="hoy">{isToday ? "Hoy" : "Asistencia"}</TabsTrigger>
          <TabsTrigger value="historial">Histórico (30 días)</TabsTrigger>
        </TabsList>

        <TabsContent value="hoy" className="space-y-3">
          <ProfesorDatePicker selectedDate={selectedDateIso} trainingDates={trainingDates} />
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
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-md">
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
                  </div>
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
