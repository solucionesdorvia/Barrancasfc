"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
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

function defaultExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function ApproveFitnessButton({
  playerId,
  currentExpiry,
}: {
  playerId: string;
  currentExpiry: Date | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) setExpiry(currentExpiry ? currentExpiry.toISOString().slice(0, 10) : defaultExpiry());
  }

  async function submit() {
    if (!expiry) {
      toast.error("Ingresá la fecha de vencimiento");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/approve-fitness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiry }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo registrar el apto");
      return;
    }
    toast.success("Apto físico cargado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {currentExpiry ? "Renovar apto" : "Cargar apto"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentExpiry ? "Renovar apto físico" : "Cargar apto físico"}</DialogTitle>
          <DialogDescription>
            Ingresá la fecha de vencimiento del nuevo certificado. Se registra con tu usuario en el historial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="expiry">Vence el</Label>
          <Input
            id="expiry"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
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
