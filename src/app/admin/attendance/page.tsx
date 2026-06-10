import Link from "next/link";
import { ChevronRight, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function AttendanceOverviewPage() {
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [categories, players, attendance] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ type: "asc" }, { year: "desc" }],
      select: { id: true, name: true, type: true },
    }),
    prisma.player.findMany({
      select: { id: true, categoryId: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: since30d } },
      select: { present: true, playerId: true },
    }),
  ]);

  // Index playerId -> categoryId
  const playerToCat = new Map(players.map((p) => [p.id, p.categoryId]));
  const playersByCat = new Map<string, number>();
  for (const p of players) {
    playersByCat.set(p.categoryId, (playersByCat.get(p.categoryId) ?? 0) + 1);
  }
  const attByCat = new Map<string, { total: number; present: number }>();
  for (const a of attendance) {
    const catId = playerToCat.get(a.playerId);
    if (!catId) continue;
    const cur = attByCat.get(catId) ?? { total: 0, present: 0 };
    cur.total++;
    if (a.present) cur.present++;
    attByCat.set(catId, cur);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Asistencia"
        description="Promedio de los últimos 30 días por categoría"
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarCheck} title="Sin categorías cargadas" bare className="py-12" />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          {/* Mobile */}
          <div className="md:hidden divide-y">
            {categories.map((c) => {
              const playerCount = playersByCat.get(c.id) ?? 0;
              const att = attByCat.get(c.id);
              const total = att?.total ?? 0;
              const present = att?.present ?? 0;
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  href={`/admin/categories/${c.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {playerCount} jugadores · {total} asistencias tomadas
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        {total > 0 && (
                          <div
                            className={
                              pct >= 80 ? "h-full bg-emerald-500" : pct >= 60 ? "h-full bg-amber-500" : "h-full bg-red-500"
                            }
                            style={{ width: `${pct}%` }}
                          />
                        )}
                      </div>
                      <span className={`text-xs font-semibold w-10 text-right tabular-nums ${total === 0 ? "text-muted-foreground" : pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {total > 0 ? `${pct}%` : "s/d"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* Desktop */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Jugadores</TableHead>
                <TableHead className="text-center">Asistencias tomadas</TableHead>
                <TableHead>Asistencia</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const playerCount = playersByCat.get(c.id) ?? 0;
                const att = attByCat.get(c.id);
                const total = att?.total ?? 0;
                const present = att?.present ?? 0;
                const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <Link href={`/admin/categories/${c.id}`} className="font-medium group-hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{playerCount}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground tabular-nums">{total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          {total > 0 && (
                            <div
                              className={
                                pct >= 80 ? "h-full bg-emerald-500" : pct >= 60 ? "h-full bg-amber-500" : "h-full bg-red-500"
                              }
                              style={{ width: `${pct}%` }}
                            />
                          )}
                        </div>
                        <span className={`text-sm font-semibold w-12 text-right tabular-nums ${total === 0 ? "text-muted-foreground" : pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                          {total > 0 ? `${pct}%` : "s/d"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/categories/${c.id}`} aria-label={`Abrir ${c.name}`} className="block">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
