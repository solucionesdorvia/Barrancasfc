"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import type { PlayerStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: PlayerStatus; label: string; description: string }[] = [
  { value: "ACTIVE", label: "Activo", description: "Entrena y juega normalmente." },
  { value: "INJURED", label: "Lesionado", description: "No entrena pero sigue en el plantel." },
  { value: "INACTIVE", label: "Inactivo", description: "No participa pero queda registrado." },
  { value: "SUSPENDED", label: "Suspendido", description: "Sancionado temporalmente." },
];

export function ChangeStatusButton({
  playerId,
  currentStatus,
}: {
  playerId: string;
  currentStatus: PlayerStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  // Resetear al cerrar el dialog
  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) setStatus(currentStatus);
  }

  async function submit() {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/change-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo cambiar el estado");
      return;
    }
    toast.success("Estado actualizado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Cambiar estado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar estado del jugador</DialogTitle>
          <DialogDescription>El cambio queda asentado en el historial.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nuevo estado</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PlayerStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <span>{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || status === currentStatus}>
            {loading ? "Guardando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
