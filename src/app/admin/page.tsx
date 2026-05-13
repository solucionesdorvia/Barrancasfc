import { Users, Wallet, AlertTriangle, ShieldAlert, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { formatARS, formatDate, monthName, initials } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const in30Days = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const [activePlayers, monthPayments, expiringFitness, recentPayments, topOverdue, last6MonthsAgg] = await Promise.all([
    prisma.player.count({ where: { status: "ACTIVE" } }),
    prisma.payment.findMany({ where: { month: currentMonth, year: currentYear } }),
    prisma.player.count({
      where: { fitnessExpiry: { lte: in30Days, gte: now }, status: "ACTIVE" },
    }),
    prisma.payment.findMany({
      where: { status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 6,
      include: { player: { include: { category: true } } },
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
      where: {
        OR: Array.from({ length: 6 }).map((_, i) => {
          const d = new Date(currentYear, currentMonth - 1 - i, 1);
          return { month: d.getMonth() + 1, year: d.getFullYear() };
        }),
      },
    }),
  ]);

  const paidThisMonth = monthPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmount = monthPayments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const totalThisMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const morosityPct = totalThisMonth ? Math.round((overdueAmount / totalThisMonth) * 100) : 0;

  // Chart data
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - (5 - i), 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const month = monthName(m).slice(0, 3);
    const period = last6MonthsAgg.filter((p) => p.month === m && p.year === y);
    const paid = period.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
    const pending = period.filter((p) => p.status !== "PAID").reduce((s, p) => s + Number(p.amount), 0);
    return { month, paid, pending };
  });

  // Top morosos players info
  const topMorososPlayers = await prisma.player.findMany({
    where: { id: { in: topOverdue.map((t) => t.playerId) } },
    include: { category: true },
  });
  const topMorososWithDebt = topOverdue.map((t) => {
    const player = topMorososPlayers.find((p) => p.id === t.playerId)!;
    return { player, debt: Number(t._sum.amount ?? 0), count: t._count };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen general del club · {monthName(currentMonth)} {currentYear}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Jugadores activos" value={String(activePlayers)} icon={Users} tone="default" />
        <KpiCard
          label="Cobrado este mes"
          value={formatARS(paidThisMonth)}
          hint={`${monthPayments.filter((p) => p.status === "PAID").length} cuotas cobradas`}
          icon={Wallet}
          tone="success"
        />
        <KpiCard
          label="Morosidad"
          value={`${morosityPct}%`}
          hint={formatARS(overdueAmount)}
          icon={AlertTriangle}
          tone="danger"
        />
        <KpiCard
          label="Aptos por vencer"
          value={String(expiringFitness)}
          hint="Próximos 30 días"
          icon={ShieldAlert}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cobranza últimos 6 meses</CardTitle>
            <CardDescription>Cuotas cobradas vs pendientes/morosas</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Top morosos</CardTitle>
              <CardDescription>Mayor deuda acumulada</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/payments">Ver todos <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMorososWithDebt.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Sin morosos. 🎉</p>
            )}
            {topMorososWithDebt.map(({ player, debt, count }) => (
              <Link
                key={player.id}
                href={`/admin/players/${player.id}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={player.photo ?? undefined} />
                  <AvatarFallback>{initials(`${player.firstName} ${player.lastName}`)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{player.firstName} {player.lastName}</p>
                  <p className="text-xs text-muted-foreground">{player.category.name} · {count} cuotas</p>
                </div>
                <span className="text-sm font-semibold text-red-600">{formatARS(debt)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos pagos</CardTitle>
          <CardDescription>Movimientos recientes de cobranza</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aún no hay pagos registrados.
                  </TableCell>
                </TableRow>
              )}
              {recentPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={p.player.photo ?? undefined} />
                        <AvatarFallback>{initials(`${p.player.firstName} ${p.player.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{p.player.firstName} {p.player.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.player.category.name}</TableCell>
                  <TableCell className="text-sm">{monthName(p.month)} {p.year}</TableCell>
                  <TableCell className="text-sm">{p.paymentMethod ?? "—"}</TableCell>
                  <TableCell className="text-sm">{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{formatARS(Number(p.amount))}</TableCell>
                  <TableCell className="text-right"><PaymentStatusBadge status={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
