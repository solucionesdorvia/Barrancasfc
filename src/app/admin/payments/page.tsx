import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GenerateFeesButton } from "@/components/admin/generate-fees-button";
import { MarkPaidButton } from "@/components/admin/mark-paid-button";
import { WhatsappReminder } from "@/components/admin/whatsapp-reminder";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { formatARS, formatDate, monthName, initials, daysBetween } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Clock } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [overdue, monthPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { status: { in: ["OVERDUE", "PENDING"] } },
      include: { player: { include: { category: true, parents: true } } },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.payment.findMany({
      where: { month, year },
    }),
  ]);

  const totalThisMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const paidThisMonth = monthPayments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const overdueAmount = monthPayments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const pendingAmount = monthPayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cobranza</h1>
          <p className="text-sm text-muted-foreground">
            {monthName(month)} {year}
          </p>
        </div>
        <GenerateFeesButton />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total del mes" value={formatARS(totalThisMonth)} icon={CircleDollarSign} />
        <KpiCard label="Cobrado" value={formatARS(paidThisMonth)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Pendiente" value={formatARS(pendingAmount)} icon={Clock} tone="warning" />
        <KpiCard label="Moroso" value={formatARS(overdueAmount)} icon={AlertTriangle} tone="danger" />
      </div>

      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30">
          <CardTitle className="text-base">Cuotas pendientes y morosas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Días</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    🎉 No hay cuotas pendientes ni morosas.
                  </TableCell>
                </TableRow>
              )}
              {overdue.map((p) => {
                const days = daysBetween(p.dueDate, now);
                const parent = p.player.parents[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/admin/players/${p.player.id}`} className="flex items-center gap-2 hover:underline">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.player.photo ?? undefined} />
                          <AvatarFallback>{initials(`${p.player.firstName} ${p.player.lastName}`)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{p.player.firstName} {p.player.lastName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{p.player.category.name}</TableCell>
                    <TableCell className="text-sm">{monthName(p.month)} {p.year}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.dueDate)}</TableCell>
                    <TableCell>
                      {days > 0 ? (
                        <Badge variant="danger">+{days}d</Badge>
                      ) : (
                        <Badge variant="outline">{Math.abs(days)}d</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatARS(Number(p.amount))}</TableCell>
                    <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {parent && (
                          <WhatsappReminder
                            playerName={`${p.player.firstName} ${p.player.lastName}`}
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
        </CardContent>
      </Card>
    </div>
  );
}
