"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatARS, monthName } from "@/lib/utils";

export function PayButton({ paymentId, amount, month, year, playerName }: { paymentId: string; amount: number; month: number; year: number; playerName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "loading" | "done">("confirm");

  async function pay() {
    setStep("loading");
    // mock: 2s y marcar pagado
    setTimeout(async () => {
      await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "MercadoPago" }),
      });
      setStep("done");
    }, 2000);
  }

  function close() {
    setOpen(false);
    setTimeout(() => setStep("confirm"), 300);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep("confirm"); }}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 gap-2 bg-barrancas-red hover:bg-barrancas-red/90">
          <CreditCard className="h-4 w-4" /> Pagar ahora
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar pago</DialogTitle>
              <DialogDescription>
                Cuota de {playerName} · {monthName(month)} {year}
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 text-center">
              <p className="text-3xl font-bold">{formatARS(amount)}</p>
              <p className="text-xs text-muted-foreground mt-2">Te redirigimos a Mercado Pago para completar el pago.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={pay} className="bg-barrancas-red hover:bg-barrancas-red/90">Continuar al pago</Button>
            </DialogFooter>
          </>
        )}
        {step === "loading" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-barrancas-red" />
            <p className="text-sm">Procesando pago…</p>
          </div>
        )}
        {step === "done" && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold">¡Pago acreditado!</p>
              <p className="text-sm text-muted-foreground mt-1">Te enviamos el comprobante por mail.</p>
            </div>
            <Button onClick={close} className="w-full">Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
