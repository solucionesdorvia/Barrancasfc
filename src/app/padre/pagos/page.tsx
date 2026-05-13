import { Card, CardContent } from "@/components/ui/card";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { PayButton } from "@/components/padre/pay-button";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { getPadreContext } from "@/lib/padre";
import { formatARS, formatDate, monthName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PadrePagosPage({ searchParams }: { searchParams: { hijo?: string } }) {
  const { children, active } = await getPadreContext(searchParams.hijo);
  if (!active) return null;

  const pending = active.payments.filter((p) => p.status === "PENDING" || p.status === "OVERDUE");
  const paid = active.payments.filter((p) => p.status === "PAID");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Pagos</h1>
      <ChildSwitcher
        items={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, photo: c.photo }))}
        activeId={active.id}
      />

      {pending.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Por pagar</h2>
          {pending.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-3 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{monthName(p.month)} {p.year}</p>
                    <p className="text-xs text-muted-foreground">Vence {formatDate(p.dueDate)}</p>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">{formatARS(Number(p.amount))}</p>
                </div>
                <PayButton
                  paymentId={p.id}
                  amount={Number(p.amount)}
                  month={p.month}
                  year={p.year}
                  playerName={`${active.firstName} ${active.lastName}`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Historial</h2>
        {paid.length === 0 && <p className="text-xs text-muted-foreground">Sin pagos registrados.</p>}
        {paid.map((p) => (
          <Card key={p.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{monthName(p.month)} {p.year}</p>
                <p className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : ""} · {p.paymentMethod ?? ""}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatARS(Number(p.amount))}</p>
                <PaymentStatusBadge status={p.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
