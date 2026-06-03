import { Wallet, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { PayButton } from "@/components/padre/pay-button";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { getPadreContext } from "@/lib/padre";
import { formatARS, formatDate, monthName, fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PadrePagosPage({ searchParams }: { searchParams: { hijo?: string } }) {
  const { children, active } = await getPadreContext(searchParams.hijo);
  if (!active) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No tenés hijos vinculados.
        </CardContent>
      </Card>
    );
  }

  const pending = active.payments.filter((p) => p.status === "PENDING" || p.status === "OVERDUE");
  const paid = active.payments.filter((p) => p.status === "PAID");
  const totalDebt = active.payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Pagos</h1>
      </div>

      <ChildSwitcher
        items={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, photo: c.photo }))}
        activeId={active.id}
      />

      {/* Resumen */}
      {totalDebt > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deuda actual</p>
            <p className="text-base font-bold tabular-nums text-red-600">{formatARS(totalDebt)}</p>
          </CardContent>
        </Card>
      )}

      {/* Por pagar */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Por pagar {pending.length > 0 && <span className="text-muted-foreground font-normal">({pending.length})</span>}
        </h2>
        {pending.length === 0 ? (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-1" />
              <p className="text-sm font-medium text-emerald-900">Todo al día</p>
              <p className="text-xs text-emerald-700">No tenés cuotas pendientes.</p>
            </CardContent>
          </Card>
        ) : (
          pending.map((p) => {
            const isOverdue = p.dueDate < now;
            return (
            <Card key={p.id}>
              <CardContent className="py-3 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{monthName(p.month)} {p.year}</p>
                    <p className={`text-xs ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      {isOverdue ? "Venció" : "Vence"} {formatDate(p.dueDate)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
                <p className="text-2xl font-bold tabular-nums">{formatARS(Number(p.amount))}</p>
                <PayButton
                  paymentId={p.id}
                  amount={Number(p.amount)}
                  month={p.month}
                  year={p.year}
                  playerName={fullName(active.firstName, active.lastName)}
                />
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Historial */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Historial</h2>
        {paid.length === 0 ? (
          <EmptyState icon={Wallet} title="Sin pagos registrados" description="Cuando pagues tu primera cuota va a aparecer acá." />
        ) : (
          paid.map((p) => (
            <Card key={p.id} className="transition-colors hover:bg-muted/30">
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{monthName(p.month)} {p.year}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paidAt ? formatDate(p.paidAt) : ""}
                    {p.paymentMethod ? ` · ${p.paymentMethod}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatARS(Number(p.amount))}</p>
                  <PaymentStatusBadge status={p.status} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
