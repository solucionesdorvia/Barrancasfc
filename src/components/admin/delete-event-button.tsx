"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId, title }: { eventId: string; title: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`¿Eliminar el evento "${title}"?`)) return;
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (!res.ok) return toast.error("No se pudo eliminar");
    toast.success("Evento eliminado");
    router.refresh();
  }
  return (
    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={remove} title="Eliminar evento">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
