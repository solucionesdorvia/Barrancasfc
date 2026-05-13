"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { monthName } from "@/lib/utils";

export function GenerateFeesButton() {
  const router = useRouter();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/payments/generate", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      toast.error("Error al generar cuotas");
      return;
    }
    const data = await res.json();
    toast.success(`${data.created} cuotas generadas`);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wand2 className="h-4 w-4" /> Generar cuotas del mes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar cuotas de {monthName(now.getMonth() + 1)} {now.getFullYear()}</DialogTitle>
          <DialogDescription>
            Se generarán cuotas pendientes para todos los jugadores activos según su plan de pago.
            Las cuotas ya existentes no se duplican.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={generate} disabled={loading}>{loading ? "Generando…" : "Generar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
