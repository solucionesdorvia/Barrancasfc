import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceForm } from "@/components/profesor/attendance-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

// Para el MVP el profesor está hardcodeado a "Infantil 2012". En el sistema final viene de relación profesor↔categorías.
const PROFE_CATEGORY_NAME = "Infantil 2012";

export default async function ProfesorPage() {
  const category = await prisma.category.findFirst({ where: { name: PROFE_CATEGORY_NAME } });
  if (!category) {
    return <p className="text-sm text-muted-foreground">No tenés categorías asignadas.</p>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const players = await prisma.player.findMany({
    where: { categoryId: category.id, status: { in: ["ACTIVE", "INJURED"] } },
    orderBy: { lastName: "asc" },
    include: {
      attendances: {
        where: { date: { gte: new Date(today.getTime() - 30 * 24 * 3600 * 1000) } },
      },
    },
  });

  const todaysAttendance = await prisma.attendance.findMany({
    where: { playerId: { in: players.map((p) => p.id) }, date: { gte: today } },
  });
  const initial: Record<string, boolean> = {};
  for (const a of todaysAttendance) initial[a.playerId] = a.present;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        <p className="text-sm text-muted-foreground">{players.length} jugadores · Tomá la asistencia del día</p>
      </div>

      <Tabs defaultValue="hoy">
        <TabsList>
          <TabsTrigger value="hoy">Hoy</TabsTrigger>
          <TabsTrigger value="historial">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="hoy">
          <AttendanceForm
            players={players.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, photo: p.photo }))}
            date={today}
            initial={initial}
            categoryId={category.id}
          />
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asistencia últimos 30 días</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {players.map((p) => {
                const total = p.attendances.length;
                const present = p.attendances.filter((a) => a.present).length;
                const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <Link key={p.id} href={`/admin/players/${p.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.photo ?? undefined} />
                      <AvatarFallback>{initials(`${p.firstName} ${p.lastName}`)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.firstName} {p.lastName}</p>
                      <div className="h-1.5 w-full bg-muted-foreground/10 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">{pct}%</span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
