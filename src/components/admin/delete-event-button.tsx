"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";

/**
 * Botón de eliminar evento. Si el evento es parte de una serie (seriesId != null),
 * muestra dos botones: borrar solo esta ocurrencia o toda la serie.
 */
export function DeleteEventButton({
  eventId,
  title,
  isSeries,
}: {
  eventId: string;
  title: string;
  isSeries?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function remove(deleteSeries: boolean) {
    const url = deleteSeries
      ? `/api/events/${eventId}?series=true`
      : `/api/events/${eventId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    const data = await res.json().catch(() => ({}));
    toast.success(deleteSeries ? `${data.deleted ?? "Varios"} eventos eliminados` : "Evento eliminado");
    router.refresh();
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-muted-foreground hover:text-red-600"
          aria-label={isSeries ? "Eliminar evento o serie" : "Eliminar evento"}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      }
      title={isSeries ? "Eliminar evento recurrente" : "Eliminar evento"}
      description={
        isSeries
          ? `"${title}" es parte de una serie. Elegí si querés borrar solo esta ocurrencia o toda la serie.`
          : `Vas a eliminar "${title}". Esta acción no se puede deshacer.`
      }
      destructive
      confirmLabel={isSeries ? "Borrar solo esta" : "Eliminar"}
      onConfirm={async () => {
        await remove(false);
      }}
    >
      {isSeries && (
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={async () => {
            await remove(true);
            setOpen(false);
          }}
        >
          Borrar toda la serie
        </Button>
      )}
    </ConfirmDialog>
  );
}
