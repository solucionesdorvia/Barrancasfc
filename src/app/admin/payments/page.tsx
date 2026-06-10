import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Clock, Wallet } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/admin/kpi-card";
import { GenerateFeesButton } from "@/components/admin/generate-fees-button";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
import { WhatsappReminder } from "@/components/admin/whatsapp-reminder";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { formatARS, formatDate, monthName, monthYear, initials, fullName, daysOverdue } from "@/lib/format";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "overdue" | "overdue_30" | "overdue_90" | "overdue_180" | "pending";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Todas",
  overdue: "Morosas",
  overdue_30: "Morosas +30d",
  overdue_90: "Morosas +90d",
  overdue_180: "Morosas +180d",
  pending: "Solo pendientes",
};

export default async function PaymentsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const filter: FilterKey = (Object.keys(FILTER_LABELS) as FilterKey[]).includes(searchParams.filter as FilterKey)
    ? (searchParams.filter as FilterKey)
    : "all";

  function whereForFilter(): Prisma.PaymentWhereInput {
    if (filter === "pending") return { status: "PENDING" };
    if (filter === "overdue") return { status: "OVERDUE" };
    if (filter === "overdue_30") {
      return { status: "OVERDUE", dueDate: { lte: new Date(now.getTime() - 30 * 24 * 3600 * 1000) } };
    }
    if (filter === "overdue_90") {
      return { status: "OVERDUE", dueDate: { lte: new Date(now.getTime() - 90 * 24 * 3600 * 1000) } };
    }
    if (filter === "overdue_180") {
      return { status: "OVERDUE", dueDate: { lte: new Date(now.getTime() - 180 * 24 * 3600 * 1000) } };
    }
    return { status: { in: ["OVERDUE", "PENDING"] } };
  }

  const [overdue, monthPayments] = await Promise.all([
    prisma.payment.findMany({
      where: whereForFilter(),
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            category: { select: { name: true } },
            parents: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      take: 150,
    }),
    prisma.payment.findMany({
      where: { month, year },
      select: { amount: true, status: true },
    }),
  ]);

  const totalThisMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const paidThisMonth = monthPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmount = monthPayments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = monthPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.amount), 0);
  const collectionRate = totalThisMonth ? Math.round((paidThisMonth / totalThisMonth) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranza"
        description={monthYear(month, year, false)}
        action={<GenerateFeesButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total del mes" value={formatARS(totalThisMonth)} icon={CircleDollarSign} />
        <KpiCard
          label="Cobrado"
          value={formatARS(paidThisMonth)}
          hint={`${collectionRate}% del total`}
          icon={CheckCircle2}
          tone="success"
        />
        <KpiCard
          label="Pendiente"
          value={formatARS(pendingAmount)}
          icon={Clock}
          tone={pendingAmount > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Moroso"
          value={formatARS(overdueAmount)}
          icon={AlertTriangle}
          tone={overdueAmount > 0 ? "danger" : "default"}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30 space-y-3">
          <div>
            <CardTitle className="text-base">Cuotas pendientes y morosas</CardTitle>
            <CardDescription>
              {overdue.length === 0
                ? "Sin cuotas para reclamar con este filtro"
                : `${overdue.length} ${overdue.length === 1 ? "cuota" : "cuotas"} · filtro: ${FILTER_LABELS[filter]}`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(FILTER_LABELS) as [FilterKey, string][]).map(([k, label]) => (
              <Link
                key={k}
                href={k === "all" ? "/admin/payments" : `/admin/payments?filter=${k}`}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filter === k
                    ? "bg-barrancas-red text-white"
                    : "bg-background border text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {overdue.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CheckCircle2}
                title="No hay cuotas pendientes ni morosas"
                description="Las cuotas se cobraron en tiempo. Generá las del próximo mes desde el botón de arriba."
                bare
              />
            </div>
          ) : (
            <>
              {/* Mobile: tarjeta apilada por cuota */}
              <div className="md:hidden divide-y">
                {overdue.map((p) => {
                  const days = daysOverdue(p.dueDate, now);
                  const parent = p.player.parents?.[0] ?? null;
                  return (
                    <div key={p.id} className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/admin/players/${p.player.id}`}
                          className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={p.player.photo ?? undefined} />
                            <AvatarFallback className="text-xs">{initials(fullName(p.player.firstName, p.player.lastName))}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.player.firstName} {p.player.lastName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{p.player.category.name}</p>
                          </div>
                        </Link>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums">{formatARS(Number(p.amount))}</p>
                          <p className="text-[11px] text-muted-foreground">{monthName(p.month, true)} {p.year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PaymentStatusBadge status={p.status} />
                        {days > 0 ? (
                          <Badge variant="danger" className="text-[10px]">+{days}d vencida</Badge>
                        ) : days === 0 ? (
                          <Badge variant="warning" className="text-[10px]">vence hoy</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">vence en {Math.abs(days)}d</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {parent && (
                          <WhatsappReminder
                            playerName={fullName(p.player.firstName, p.player.lastName)}
                            parentName={parent.name}
                            amount={Number(p.amount)}
                            month={p.month}
                            year={p.year}
                            daysOverdue={Math.max(0, days)}
                          />
                        )}
                        <MarkPaidButton paymentId={p.id} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: tabla completa */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Vence</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map((p) => {
                    const days = daysOverdue(p.dueDate, now);
                    const parent = p.player.parents?.[0] ?? null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/admin/players/${p.player.id}`} className="flex items-center gap-2 hover:underline">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={p.player.photo ?? undefined} />
                              <AvatarFallback className="text-xs">{initials(fullName(p.player.firstName, p.player.lastName))}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{p.player.firstName} {p.player.lastName}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.player.category.name}</TableCell>
                        <TableCell className="text-sm">{monthName(p.month, true)} {p.year}</TableCell>
                        <TableCell className="text-sm">{formatDate(p.dueDate)}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {days > 0 ? (
                            <Badge variant="danger">+{days}d</Badge>
                          ) : days === 0 ? (
                            <Badge variant="warning">hoy</Badge>
                          ) : (
                            <Badge variant="outline">{Math.abs(days)}d</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{formatARS(Number(p.amount))}</TableCell>
                        <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {parent && (
                              <WhatsappReminder
                                playerName={fullName(p.player.firstName, p.player.lastName)}
                                parentName={parent.name}
                                amount={Number(p.amount)}
                                month={p.month}
                                year={p.year}
                                daysOverdue={Math.max(0, days)}
                              />
                            )}
                            <MarkPaidButton paymentId={p.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Hint útil cuando no hay nada que cobrar */}
      {overdue.length === 0 && totalThisMonth === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            <Wallet className="h-5 w-5 mx-auto mb-2 opacity-60" />
            Todavía no hay cuotas de {monthName(month)}. Generalas para arrancar el mes.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
