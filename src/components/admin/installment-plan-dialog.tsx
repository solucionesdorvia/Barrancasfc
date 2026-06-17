"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { formatARS, monthName } from "@/lib/format";

type DuePayment = {
  id: string;
  amount: number;
  month: number;
  year: number;
};

export function InstallmentPlanDialog({
  playerId,
  playerName,
  payments,
}: {
  playerId: string;
  playerName: string;
  payments: DuePayment[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(payments.map((p) => p.id)));
  const [installments, setInstallments] = useState("3");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(
    () => payments.filter((p) => selected.has(p.id)).reduce((s, p) => s + p.amount, 0),
    [payments, selected]
  );
  const monthly = total / Number(installments || 1);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (selected.size === 0) {
      toast.error("Seleccioná al menos una cuota a refinanciar");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/installment-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        paymentIds: Array.from(selected),
        installments: Number(installments),
        notes: notes || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo crear el plan");
      return;
    }
    toast.success(`Plan creado · ${installments} cuotas de ${formatARS(monthly)}`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <CalendarRange className="h-3.5 w-3.5" /> Plan de pagos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Armar plan de pagos</DialogTitle>
          <DialogDescription>
            Refinanciá las cuotas atrasadas de {playerName} en varias mensualidades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Cuotas a refinanciar
            </p>
            <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
              {payments.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(p.id)}
                    onCheckedChange={() => toggle(p.id)}
                  />
                  <span className="text-sm flex-1">{monthName(p.month)} {p.year}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatARS(p.amount)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Cantidad de cuotas</label>
            <Select value={installments} onValueChange={setInstallments}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 6, 8, 12].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-zinc-50 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calculator className="h-3 w-3" /> Resumen
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Deuda a refinanciar</span>
              <span className="font-semibold tabular-nums">{formatARS(total)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm">{installments} cuotas mensuales de</span>
              <span className="text-xl font-bold text-club tabular-nums">{formatARS(monthly)}</span>
            </div>
          </div>

          <Textarea
            placeholder="Notas internas (opcional): condiciones acordadas con la familia, motivo, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || selected.size === 0} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
