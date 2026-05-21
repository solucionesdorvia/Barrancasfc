import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatARS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // Queries en paralelo, todas con shape específico
  const [categories, playerStatsRaw, overdueAgg, attendanceAgg] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ type: "asc" }, { year: "desc" }],
      select: { id: true, name: true, type: true, year: true },
    }),
    prisma.player.groupBy({
      by: ["categoryId", "status"],
      _count: true,
    }),
    prisma.payment.findMany({
      where: { status: "OVERDUE" },
      select: { amount: true, player: { select: { categoryId: true } } },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: since30d } },
      select: { present: true, player: { select: { categoryId: true } } },
    }),
  ]);

  // Indexar stats por category
  type PlayerCounts = { total: number; active: number; injured: number };
  const playersByCat = new Map<string, PlayerCounts>();
  for (const s of playerStatsRaw) {
    const cur = playersByCat.get(s.categoryId) ?? { total: 0, active: 0, injured: 0 };
    cur.total += s._count;
    if (s.status === "ACTIVE") cur.active += s._count;
    if (s.status === "INJURED") cur.injured += s._count;
    playersByCat.set(s.categoryId, cur);
  }

  // Deuda y morosos por categoría
  type DebtStats = { debt: number; players: Set<string> };
  const debtByCat = new Map<string, DebtStats>();
  for (const p of overdueAgg) {
    const catId = p.player.categoryId;
    const cur = debtByCat.get(catId) ?? { debt: 0, players: new Set() };
    cur.debt += Number(p.amount);
    cur.players.add(catId);
    debtByCat.set(catId, cur);
  }
  // morosos por categoría: contar players únicos con OVERDUE
  const morosoPlayersByCat = new Map<string, Set<string>>();
  // El groupBy no nos da playerId, necesitamos otra ruta. Hacemos rápido:
  const overdueByPlayer = await prisma.payment.findMany({
    where: { status: "OVERDUE" },
    select: { playerId: true, player: { select: { categoryId: true } } },
    distinct: ["playerId"],
  });
  for (const o of overdueByPlayer) {
    const set = morosoPlayersByCat.get(o.player.categoryId) ?? new Set<string>();
    set.add(o.playerId);
    morosoPlayersByCat.set(o.player.categoryId, set);
  }

  // Asistencia agregada por categoría
  const attByCat = new Map<string, { total: number; present: number }>();
  for (const a of attendanceAgg) {
    const cur = attByCat.get(a.player.categoryId) ?? { total: 0, present: 0 };
    cur.total++;
    if (a.present) cur.present++;
    attByCat.set(a.player.categoryId, cur);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Plantel por categorías"
        description={`Vista de gestión · ${categories.length} categorías activas`}
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Shield}
            title="Sin categorías cargadas"
            description="Cargá una categoría desde la administración para arrancar."
            bare
            className="py-12"
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Jugadores</TableHead>
                <TableHead className="text-center">Activos</TableHead>
                <TableHead className="text-center">Lesionados</TableHead>
                <TableHead className="text-center">Asistencia</TableHead>
                <TableHead className="text-center">Morosos</TableHead>
                <TableHead className="text-right">Deuda total</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const stats = playersByCat.get(c.id) ?? { total: 0, active: 0, injured: 0 };
                const morosos = morosoPlayersByCat.get(c.id)?.size ?? 0;
                const debt = debtByCat.get(c.id)?.debt ?? 0;
                const att = attByCat.get(c.id);
                const attPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <Link href={`/admin/categories/${c.id}`} className="block">
                        <p className="font-medium group-hover:underline">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.type === "INFANTIL" ? "Infantil" : c.type === "JUVENIL" ? "Juvenil" : "Profesional"}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">{stats.total}</TableCell>
                    <TableCell className="text-center">
                      {stats.active > 0 ? <Badge variant="success">{stats.active}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.injured > 0 ? <Badge variant="warning">{stats.injured}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {attPct !== null ? (
                        <span className={`tabular-nums font-semibold ${attPct >= 80 ? "text-emerald-600" : attPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                          {attPct}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">s/d</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {morosos > 0 ? <Badge variant="danger">{morosos}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {debt > 0 ? <span className="text-red-600">{formatARS(debt)}</span> : <span className="text-muted-foreground">—</span>}
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
