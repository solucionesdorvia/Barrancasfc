"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  playerId: string;
  initialGroupId: string | null;
  initialPercent: number | null;
  /** Lista de jugadores del mismo grupo familiar (para mostrar al admin) */
  groupSiblings: { id: string; firstName: string; lastName: string; categoryName: string | null }[];
};

export function FamilyGroupForm({ playerId, initialGroupId, initialPercent, groupSiblings }: Props) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(initialGroupId ?? "");
  const [percent, setPercent] = useState<string>(initialPercent?.toString() ?? "0");
  const [loading, setLoading] = useState(false);

  async function save() {
    const pctNum = Number(percent);
    if (groupId.trim() && (Number.isNaN(pctNum) || pctNum < 0 || pctNum > 100)) {
      toast.error("El descuento tiene que estar entre 0 y 100%");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/family-group`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyGroupId: groupId.trim() || null,
        familyDiscountPercent: groupId.trim() ? pctNum : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo guardar");
      return;
    }
    toast.success(groupId.trim() ? "Grupo familiar actualizado" : "Grupo familiar eliminado");
    router.refresh();
  }

  async function clearGroup() {
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/family-group`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyGroupId: null, familyDiscountPercent: null }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo limpiar");
      return;
    }
    setGroupId("");
    setPercent("0");
    toast.success("Grupo eliminado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-violet-600" />
        <p className="text-muted-foreground">
          Agrupá hermanos bajo el mismo ID para aplicar descuento por hermano en la cuota mensual.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fg-id">ID de grupo familiar</Label>
          <Input
            id="fg-id"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Ej: garcia-perez"
            maxLength={60}
          />
          <p className="text-[10px] text-muted-foreground">
            Usá el mismo ID en todos los hermanos.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fg-pct">Descuento (%)</Label>
          <Input
            id="fg-pct"
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            disabled={!groupId.trim()}
          />
          <p className="text-[10px] text-muted-foreground">
            Se aplica a la cuota mensual del jugador.
          </p>
        </div>
      </div>

      {groupSiblings.length > 0 && (
        <div className="rounded-md border bg-violet-50/40 p-3">
          <p className="text-xs font-medium text-violet-900 mb-2">
            En este grupo familiar también están:
          </p>
          <ul className="text-sm space-y-1">
            {groupSiblings.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span>{s.firstName} {s.lastName}</span>
                {s.categoryName && (
                  <span className="text-[10px] text-muted-foreground">· {s.categoryName}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {initialGroupId && (
          <Button variant="ghost" onClick={clearGroup} disabled={loading}>
            Quitar del grupo
          </Button>
        )}
        <Button onClick={save} disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
