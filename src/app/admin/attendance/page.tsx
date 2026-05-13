import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AttendanceOverviewPage() {
  const categories = await prisma.category.findMany({
    include: {
      players: {
        include: {
          attendances: {
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
        <p className="text-sm text-muted-foreground">Asistencia promedio últimos 30 días por categoría</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => {
          const total = c.players.reduce((s, p) => s + p.attendances.length, 0);
          const present = c.players.reduce((s, p) => s + p.attendances.filter((a) => a.present).length, 0);
          const pct = total > 0 ? Math.round((present / total) * 100) : 0;
          return (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <CardDescription>{c.players.length} jugadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold">{pct}%</p>
                    <p className="text-xs text-muted-foreground">asistencia promedio</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/players?categoryId=${c.id}`}>Ver jugadores</Link>
                  </Button>
                </div>
                <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
