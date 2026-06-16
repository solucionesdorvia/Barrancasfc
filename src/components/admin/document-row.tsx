"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, ArrowUpRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";

type Props = {
  id: string;
  name: string;
  typeLabel: string;
  uploadedHint: string;
  canDelete: boolean;
};

/**
 * Fila de documento: link "Ver" (sirve desde /api/documents/[id]/file)
 * + botón eliminar (admin only).
 */
export function DocumentRow({ id, name, typeLabel, uploadedHint, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo borrar");
      return;
    }
    toast.success("Documento eliminado");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 grid place-items-center shrink-0">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{typeLabel} · {uploadedHint}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button asChild size="sm" variant="outline" className="gap-1">
          <a href={`/api/documents/${id}/file`} target="_blank" rel="noopener noreferrer">
            Ver <ArrowUpRight className="h-3 w-3" />
          </a>
        </Button>
        {canDelete && (
          <ConfirmDialog
            trigger={
              <Button
                size="icon"
                variant="ghost"
                aria-label="Eliminar documento"
                disabled={loading}
                className="h-9 w-9 text-muted-foreground hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
            title="¿Eliminar este documento?"
            description={`Se borra "${name}" del jugador. No se puede deshacer.`}
            destructive
            confirmLabel="Sí, eliminar"
            onConfirm={remove}
          />
        )}
      </div>
    </div>
  );
}
