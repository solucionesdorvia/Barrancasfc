"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const METHODS = ["Transferencia", "MercadoPago", "Efectivo", "Tarjeta", "Otro"] as const;
type Method = (typeof METHODS)[number];

export function MarkPaidButton({ paymentId, defaultMethod = "Transferencia" }: { paymentId: string; defaultMethod?: Method }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>(defaultMethod);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) setMethod(defaultMethod);
  }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/payments/${paymentId}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo registrar el pago");
      return;
    }
    toast.success("Pago registrado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" /> Marcar pagado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>Confirmá el método con el que se cobró la cuota.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Método de cobro</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m === "MercadoPago" ? "Mercado Pago" : m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Guardando…" : "Confirmar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
