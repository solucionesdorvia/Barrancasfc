import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, Activity, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { ExportButton } from "@/components/admin/export-button";
import { formatARS, monthName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  await requireRole("ADMIN");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const sixMonthsAgo = new Date(year, month - 6, 1);

  const [players, payments, attendances, categories] = await Promise.all([
    prisma.player.findMany({ include: { category: true, payments: { where: { status: "OVERDUE" } } } }),
    prisma.payment.findMany({ where: { dueDate: { gte: sixMonthsAgo } } }),
    prisma.attendance.findMany({
      where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      include: { player: { include: { category: true } } },
    }),
    prisma.category.findMany({ orderBy: [{ type: "asc" }, { year: "desc" }] }),
  ]);

  // KPIs
  const totalActive = players.filter((p) => p.status === "ACTIVE").length;
  const monthPayments = payments.filter((p) => p.month === month && p.year === year);
  const cashIn = monthPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const expected = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const collectionRate = expected ? Math.round((cashIn / expected) * 100) : 0;

  const totalDebt = players.reduce(
    (s, p) => s + p.payments.reduce((ps, pay) => ps + Number(pay.amount), 0),
    0
  );

  // Cobranza por mes (últimos 6)
  const monthlyRev: { month: number; year: number; paid: number; total: number; rate: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const period = payments.filter((p) => p.month === m && p.year === y);
    const paid = period.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
    const total = period.reduce((s, p) => s + Number(p.amount), 0);
    monthlyRev.push({ month: m, year: y, paid, total, rate: total ? Math.round((paid / total) * 100) : 0 });
  }

  // Cobranza y deuda por categoría
  const byCategory = categories.map((cat) => {
    const catPlayers = players.filter((p) => p.categoryId === cat.id);
    const debt = catPlayers.reduce(
      (s, p) => s + p.payments.reduce((ps, pay) => ps + Number(pay.amount), 0),
      0
    );
    const overdueCount = catPlayers.filter((p) => p.payments.length > 0).length;
    const att = attendances.filter((a) => a.player.categoryId === cat.id);
    const attRate = att.length > 0 ? Math.round((att.filter((a) => a.present).length / att.length) * 100) : null;
    return {
      id: cat.id,
      name: cat.name,
      players: catPlayers.length,
      active: catPlayers.filter((p) => p.status === "ACTIVE").length,
      overdueCount,
      debt,
      attRate,
    };
  });

  // Top 10 morosos
  const topMorosos = players
    .map((p) => ({
      id: p.id,
      name: `${p.lastName}, ${p.firstName}`,
      category: p.category.name,
      debt: p.payments.reduce((s, pay) => s + Number(pay.amount), 0),
      months: p.payments.length,
    }))
    .filter((p) => p.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 10);

  // Datos de exportación
  const exportPlayers: (string | number)[][] = [
    ["Apellido", "Nombre", "DNI", "Categoría", "Estado", "Cuota", "Beca", "Apto físico vence"],
    ...players.map((p) => [
      p.lastName,
      p.firstName,
      p.dni ?? "",
      p.category.name,
      p.status,
      Number(p.monthlyFee),
      p.scholarshipType ?? "NONE",
      p.fitnessExpiry ? new Date(p.fitnessExpiry).toLocaleDateString("es-AR") : "",
    ]),
  ];

  const exportRevenue: (string | number)[][] = [
    ["Período", "Cobrado", "Esperado", "Porcentaje"],
    ...monthlyRev.map((m) => [
      `${monthName(m.month)} ${m.year}`,
      m.paid,
      m.total,
      `${m.rate}%`,
    ]),
  ];

  const exportCategories: (string | number)[][] = [
    ["Categoría", "Jugadores", "Activos", "Morosos", "Deuda", "Asistencia %"],
    ...byCategory.map((c) => [c.name, c.players, c.active, c.overdueCount, c.debt, c.attRate ?? "s/d"]),
  ];

  const exportMorosos: (string | number)[][] = [
    ["Jugador", "Categoría", "Meses adeudados", "Deuda"],
    ...topMorosos.map((m) => [m.name, m.category, m.months, m.debt]),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Resúmenes para tomar decisiones. Cada bloque se exporta a Excel."
      />

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Jugadores activos" value={String(totalActive)} icon={Users} />
        <KpiCard
          label="Cobranza del mes"
          value={`${collectionRate}%`}
          hint={`${formatARS(cashIn)} de ${formatARS(expected)}`}
          icon={collectionRate >= 70 ? TrendingUp : TrendingDown}
          tone={collectionRate >= 70 ? "success" : collectionRate >= 50 ? "warning" : "danger"}
        />
        <KpiCard label="Deuda total" value={formatARS(totalDebt)} icon={AlertTriangle} tone="danger" />
        <KpiCard
          label="Eventos próximos"
          value={String(await prisma.event.count({ where: { date: { gte: now } } }).catch(() => 0))}
          icon={Calendar}
        />
      </div>

      {/* Cobranza 6 meses */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4" /> Cobranza últimos 6 meses</CardTitle>
            <CardDescription>Comparación de lo cobrado vs lo esperado por mes.</CardDescription>
          </div>
          <ExportButton rows={exportRevenue} filename="cobranza-6-meses" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Cobrado</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyRev.map((m) => (
                <TableRow key={`${m.year}-${m.month}`}>
                  <TableCell className="text-sm">{monthName(m.month)} {m.year}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatARS(m.paid)}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{formatARS(m.total)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={m.rate >= 80 ? "h-full bg-emerald-500" : m.rate >= 60 ? "h-full bg-amber-500" : "h-full bg-red-500"}
                          style={{ width: `${m.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-8 text-right">{m.rate}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Por categoría */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Resumen por categoría</CardTitle>
            <CardDescription>Plantel, deuda y asistencia por categoría.</CardDescription>
          </div>
          <ExportButton rows={exportCategories} filename="resumen-por-categoria" />
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile */}
          <div className="md:hidden divide-y">
            {byCategory.map((c) => (
              <div key={c.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums shrink-0">{c.players} jugadores</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Activos</p>
                    <p className="font-semibold tabular-nums">{c.active}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Morosos</p>
                    <p className={`font-semibold tabular-nums ${c.overdueCount > 0 ? "text-red-600" : ""}`}>{c.overdueCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Asistencia</p>
                    <p className="font-semibold tabular-nums">{c.attRate !== null ? `${c.attRate}%` : "—"}</p>
                  </div>
                </div>
                {c.debt > 0 && (
                  <p className="text-xs"><span className="text-muted-foreground">Deuda:</span> <span className="font-semibold text-red-600 tabular-nums">{formatARS(c.debt)}</span></p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Jugadores</TableHead>
                <TableHead className="text-center">Activos</TableHead>
                <TableHead className="text-center">Morosos</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead className="text-right">Asistencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byCategory.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="text-center">{c.players}</TableCell>
                  <TableCell className="text-center">{c.active}</TableCell>
                  <TableCell className="text-center">{c.overdueCount > 0 ? <span className="text-red-600 font-semibold">{c.overdueCount}</span> : c.overdueCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.debt > 0 ? <span className="text-red-600 font-semibold">{formatARS(c.debt)}</span> : "—"}</TableCell>
                  <TableCell className="text-right">{c.attRate !== null ? `${c.attRate}%` : <span className="text-muted-foreground text-xs">s/d</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top morosos */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Top 10 morosos</CardTitle>
            <CardDescription>Jugadores con mayor deuda acumulada.</CardDescription>
          </div>
          <ExportButton rows={exportMorosos} filename="top-morosos" />
        </CardHeader>
        <CardContent className="p-0">
          {topMorosos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">🎉 Sin morosos.</p>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden divide-y">
                {topMorosos.map((m, i) => (
                  <div key={m.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        <span className="text-muted-foreground mr-1.5">#{i + 1}</span>{m.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{m.category} · {m.months} meses</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600 tabular-nums shrink-0">{formatARS(m.debt)}</p>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Meses</TableHead>
                    <TableHead className="text-right">Deuda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMorosos.map((m, i) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground mr-2">#{i + 1}</span>
                        {m.name}
                      </TableCell>
                      <TableCell className="text-sm">{m.category}</TableCell>
                      <TableCell className="text-center">{m.months}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600 tabular-nums">{formatARS(m.debt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Export del plantel completo */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Plantel completo</CardTitle>
            <CardDescription>Listado de jugadores con todos sus datos en formato Excel.</CardDescription>
          </div>
          <ExportButton rows={exportPlayers} filename={`plantel-${year}-${String(month).padStart(2, "0")}`} label="Descargar plantel" />
        </CardHeader>
      </Card>
    </div>
  );
}
