"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Trash2, Loader2, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  assignedToId: string | null;
  assignedToRole: string | null;
  relatedPlayerId: string | null;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
  assigneeName?: string | null;
  playerName?: string | null;
};

const PRIORITY_STYLES: Record<Task["priority"], { label: string; cls: string }> = {
  LOW: { label: "Baja", cls: "border-zinc-300 text-zinc-600" },
  NORMAL: { label: "Normal", cls: "border-blue-300 text-blue-700" },
  HIGH: { label: "Alta", cls: "border-amber-400 text-amber-700" },
  URGENT: { label: "Urgente", cls: "border-rose-400 text-rose-700 bg-rose-50" },
};

export function StaffTaskRow({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDone = task.status === "DONE";
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && !isDone && dueDate < new Date();
  const prio = PRIORITY_STYLES[task.priority];

  async function setStatus(status: Task["status"]) {
    setLoading(true);
    const res = await fetch(`/api/staff-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo actualizar");
      return;
    }
    toast.success(status === "DONE" ? "Tarea completada" : "Tarea actualizada");
    startTransition(() => router.refresh());
  }

  async function remove() {
    setLoading(true);
    const res = await fetch(`/api/staff-tasks/${task.id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      toast.error("No se pudo eliminar");
      return;
    }
    toast.success("Tarea eliminada");
    startTransition(() => router.refresh());
  }

  return (
    <Card className={cn("transition", isDone && "opacity-60")}>
      <CardContent className="py-3.5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setStatus(isDone ? "PENDING" : "DONE")}
            disabled={loading}
            aria-label={isDone ? "Marcar como pendiente" : "Marcar como completada"}
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 grid place-items-center transition",
              isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 hover:border-emerald-400"
            )}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : isDone ? <Check className="h-3 w-3" /> : null}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className={cn("font-medium text-sm leading-snug", isDone && "line-through text-muted-foreground")}>
                {task.title}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className={cn("text-[10px]", prio.cls)}>
                  {prio.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <Clock className="h-3 w-3" /> Vencida
                  </Badge>
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{task.description}</p>
            )}

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-2">
              {task.assigneeName ? (
                <span>👤 {task.assigneeName}</span>
              ) : task.assignedToRole ? (
                <span>👥 Todos los {task.assignedToRole.toLowerCase()}s</span>
              ) : (
                <span className="italic">Sin asignar</span>
              )}
              {task.playerName && <span>⚽ {task.playerName}</span>}
              {dueDate && (
                <span className={cn(isOverdue && "text-rose-600 font-medium")}>
                  📅 {dueDate.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                </span>
              )}
            </div>
          </div>

          {canEdit && !isDone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              aria-label="Eliminar tarea"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {canEdit && isDone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStatus("PENDING")}
              disabled={loading}
              aria-label="Reabrir tarea"
              className="h-8 w-8 shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Eliminar tarea"
          description="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          destructive
          onConfirm={remove}
        />
      </CardContent>
    </Card>
  );
}
