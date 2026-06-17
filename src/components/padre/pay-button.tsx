"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
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
import { formatARS, monthName } from "@/lib/format";

type Step = "confirm" | "loading" | "done";

export function PayButton({
  paymentId,
  amount,
  month,
  year,
  playerName,
}: {
  paymentId: string;
  amount: number;
  month: number;
  year: number;
  playerName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("confirm");

  async function pay() {
    setStep("loading");
    try {
      // Simula la latencia del gateway. 1.5s alcanza para que se sienta real sin aburrir.
      await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "MercadoPago" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "No se pudo procesar el pago");
        setStep("confirm");
        return;
      }
      setStep("done");
    } catch {
      toast.error("Error de conexión");
      setStep("confirm");
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => setStep("confirm"), 200);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep("confirm"); }}>
      <DialogTrigger asChild>
        <Button className="w-full h-12 gap-2 bg-club hover:bg-club/90 shadow-sm">
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
            <div className="py-4 text-center">
              <p className="text-4xl font-bold tabular-nums">{formatARS(amount)}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Te redirigimos a Mercado Pago para completar el pago de forma segura.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={pay} className="bg-club hover:bg-club/90 gap-2">
                <CreditCard className="h-4 w-4" /> Continuar al pago
              </Button>
            </DialogFooter>
          </>
        )}
        {step === "loading" && (
          <div className="py-14 text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-club" />
            <p className="text-sm">Procesando pago seguro…</p>
            <p className="text-xs text-muted-foreground">No cierres esta ventana.</p>
          </div>
        )}
        {step === "done" && (
          <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">¡Pago acreditado!</p>
              <p className="text-sm text-muted-foreground mt-1">Te enviamos el comprobante por email.</p>
            </div>
            <Button onClick={close} className="w-full">Listo</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
