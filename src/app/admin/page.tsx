import Link from "next/link";
import { Users, Wallet, AlertTriangle, ShieldAlert, ArrowUpRight, Activity, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { formatARS, formatRelative, monthName, monthYear, initials, fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const in30Days = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const last6MonthsRanges = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  // Todo en paralelo: arrancamos todo y resolvemos al final
  const [
    activePlayers,
    monthPayments,
    expiringFitness,
    recentPayments,
    topOverdueAgg,
    last6MonthsAgg,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.player.count({ where: { status: "ACTIVE" } }),
    prisma.payment.findMany({
      where: { month: currentMonth, year: currentYear },
      select: { amount: true, status: true },
    }),
    prisma.player.count({
      where: { fitnessExpiry: { lte: in30Days, gte: now }, status: "ACTIVE" },
    }),
    prisma.payment.findMany({
      where: { status: "PAID", paidAt: { not: null } },
      orderBy: { paidAt: "desc" },
      take: 6,
      select: {
        id: true,
        amount: true,
        month: true,
        year: true,
        paidAt: true,
        paymentMethod: true,
        status: true,
        player: { select: { id: true, firstName: true, lastName: true, photo: true, category: { select: { name: true } } } },
      },
    }),
    prisma.payment.groupBy({
      by: ["playerId"],
      where: { status: "OVERDUE" },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { OR: last6MonthsRanges },
      select: { amount: true, status: true, month: true, year: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const paidThisMonthPayments = monthPayments.filter((p) => p.status === "PAID");
  const paidThisMonth = paidThisMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmount = monthPayments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const totalThisMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const morosityPct = totalThisMonth ? Math.round((overdueAmount / totalThisMonth) * 100) : 0;
  const collectionRate = totalThisMonth ? Math.round((paidThisMonth / totalThisMonth) * 100) : 0;

  // Chart data ordenado del más viejo al más nuevo
  const chartData = [...last6MonthsRanges].reverse().map(({ month, year }) => {
    const period = last6MonthsAgg.filter((p) => p.month === month && p.year === year);
    const paid = period.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
    const pending = period.filter((p) => p.status !== "PAID").reduce((s, p) => s + Number(p.amount), 0);
    return { month: monthName(month, true), paid, pending };
  });

  // Top morosos: 1 sola query adicional con el set de playerIds
  const topMorososPlayers = topOverdueAgg.length
    ? await prisma.player.findMany({
        where: { id: { in: topOverdueAgg.map((t) => t.playerId) } },
        select: { id: true, firstName: true, lastName: true, photo: true, category: { select: { name: true } } },
      })
    : [];

  const playerById = new Map(topMorososPlayers.map((p) => [p.id, p]));
  const topMorosos = topOverdueAgg
    .map((t) => {
      const player = playerById.get(t.playerId);
      if (!player) return null;
      return { player, debt: Number(t._sum.amount ?? 0), count: t._count };
    })
    .filter((x): x is { player: typeof topMorososPlayers[number]; debt: number; count: number } => x !== null);

  // Audit logs con sus user
  const userIds = Array.from(new Set(recentAuditLogs.map((l) => l.userId)));
  const auditUsers = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, role: true } })
    : [];
  const userMap = new Map(auditUsers.map((u) => [u.id, u]));
  const logsWithUser = recentAuditLogs.map((l) => ({ ...l, user: userMap.get(l.userId) ?? null }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Resumen del club · ${monthYear(currentMonth, currentYear, false)}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Jugadores activos" value={String(activePlayers)} icon={Users} />
        <KpiCard
          label="Cobrado este mes"
          value={formatARS(paidThisMonth)}
          hint={`${paidThisMonthPayments.length} cuotas · ${collectionRate}% del total`}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Morosidad"
          value={`${morosityPct}%`}
          hint={overdueAmount > 0 ? formatARS(overdueAmount) : "Sin morosidad"}
          icon={AlertTriangle}
          tone={morosityPct > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Aptos por vencer"
          value={String(expiringFitness)}
          hint="Próximos 30 días"
          icon={ShieldAlert}
          tone={expiringFitness > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-barrancas-red" /> Cobranza últimos 6 meses
            </CardTitle>
            <CardDescription>Cuotas cobradas vs pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Top morosos</CardTitle>
              <CardDescription>Mayor deuda acumulada</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="gap-1">
              <Link href="/admin/payments">Ver todos <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {topMorosos.length === 0 ? (
              <EmptyState
                title="Sin morosos"
                description="Todas las cuotas están al día. 🎉"
                bare
                className="py-8"
              />
            ) : (
              topMorosos.map(({ player, debt, count }) => (
                <Link
                  key={player.id}
                  href={`/admin/players/${player.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={player.photo ?? undefined} />
                    <AvatarFallback>{initials(fullName(player.firstName, player.lastName))}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{player.firstName} {player.lastName}</p>
                    <p className="text-xs text-muted-foreground">{player.category.name} · {count} {count === 1 ? "cuota" : "cuotas"}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 tabular-nums">{formatARS(debt)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base">Últimos pagos</CardTitle>
              <CardDescription>Movimientos recientes de cobranza</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="gap-1">
              <Link href="/admin/payments">Ver todos <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentPayments.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Wallet} title="Aún no hay pagos cobrados" bare />
              </div>
            ) : (
              <>
                {/* Mobile */}
                <div className="md:hidden divide-y">
                  {recentPayments.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/players/${p.player.id}`}
                      className="flex items-start justify-between gap-3 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={p.player.photo ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(fullName(p.player.firstName, p.player.lastName))}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.player.firstName} {p.player.lastName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {monthName(p.month, true)} {p.year} · {p.paymentMethod ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium tabular-nums">{formatARS(Number(p.amount))}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {p.paidAt ? formatRelative(p.paidAt) : "—"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jugador</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Cuándo</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/admin/players/${p.player.id}`} className="flex items-center gap-2 hover:underline">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p.player.photo ?? undefined} />
                              <AvatarFallback className="text-xs">{initials(fullName(p.player.firstName, p.player.lastName))}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="text-sm font-medium block leading-tight">{p.player.firstName} {p.player.lastName}</span>
                              <span className="text-xs text-muted-foreground">{p.player.category.name}</span>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{monthName(p.month, true)} {p.year}</TableCell>
                        <TableCell className="text-sm">{p.paymentMethod ?? "—"}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {p.paidAt ? formatRelative(p.paidAt) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatARS(Number(p.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Actividad reciente
              </CardTitle>
              <CardDescription>Últimos movimientos en el sistema</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="gap-1">
              <Link href="/admin/audit">Ver todo <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <AuditTimeline logs={logsWithUser} showUser />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
