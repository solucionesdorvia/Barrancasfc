"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Botón de eliminar evento. Si el evento es parte de una serie (seriesId != null),
 * pregunta si borrar solo esta ocurrencia o toda la serie.
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

  async function remove() {
    let deleteSeries = false;
    if (isSeries) {
      const choice = window.prompt(
        `"${title}" es parte de una serie recurrente.\n\nEscribí "todos" para borrar toda la serie, o "uno" para borrar solo esta ocurrencia. (Cancelar para no hacer nada.)`,
        "uno"
      );
      if (!choice) return;
      const c = choice.trim().toLowerCase();
      if (c !== "uno" && c !== "todos") {
        toast.error("Opción no reconocida");
        return;
      }
      deleteSeries = c === "todos";
    } else {
      if (!confirm(`¿Eliminar el evento "${title}"?`)) return;
    }

    const url = deleteSeries
      ? `/api/events/${eventId}?series=true`
      : `/api/events/${eventId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) return toast.error("No se pudo eliminar");

    const data = await res.json().catch(() => ({}));
    toast.success(deleteSeries ? `${data.deleted ?? "Varios"} eventos eliminados` : "Evento eliminado");
    router.refresh();
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7 text-muted-foreground hover:text-red-600"
      onClick={remove}
      title={isSeries ? "Eliminar (evento o serie)" : "Eliminar evento"}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
