"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleDollarSign } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatARS } from "@/lib/format";

export function UpdateFeeButton({
  playerId,
  currentFee,
}: {
  playerId: string;
  currentFee: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fee, setFee] = useState(String(currentFee));
  const [loading, setLoading] = useState(false);

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) setFee(String(currentFee));
  }

  async function submit() {
    const n = Number(fee);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Importe inválido");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/update-fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyFee: n }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo actualizar la cuota");
      return;
    }
    toast.success("Cuota actualizada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CircleDollarSign className="h-3.5 w-3.5" /> Editar cuota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cuota mensual</DialogTitle>
          <DialogDescription>
            Cuota actual: <span className="font-medium">{formatARS(currentFee)}</span>.
            El cambio afecta solo a las cuotas futuras que generes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="fee">Nuevo importe</Label>
          <Input
            id="fee"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Guardando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
