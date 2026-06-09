"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Person = { id: string; name: string; role: string };

export function CreateTaskButton({ staff }: { staff: Person[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [assignTo, setAssignTo] = useState<string>("UNASSIGNED");
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("NORMAL");
    setAssignTo("UNASSIGNED");
    setDueDate("");
  }

  async function submit() {
    if (title.trim().length < 2) {
      toast.error("El título es muy corto");
      return;
    }

    // assignTo puede ser: "UNASSIGNED" | "role:ADMIN/PROFESOR/PADRE" | "user:<id>"
    let assignedToId: string | null = null;
    let assignedToRole: string | null = null;
    if (assignTo.startsWith("user:")) assignedToId = assignTo.slice(5);
    else if (assignTo.startsWith("role:")) assignedToRole = assignTo.slice(5);

    setLoading(true);
    const res = await fetch("/api/staff-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignedToId,
        assignedToRole,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo crear la tarea");
      return;
    }
    toast.success("Tarea creada");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva tarea del staff</DialogTitle>
          <DialogDescription>Asignala a una persona específica o a todo un rol.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Título</Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Revisar inscripciones de la 7ma"
              maxLength={140}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Detalle (opcional)</Label>
            <textarea
              id="t-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Vence (opcional)</Label>
              <Input
                id="t-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Asignar a</Label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="UNASSIGNED">Sin asignar</SelectItem>
                <SelectItem value="role:ADMIN">Todos los admins</SelectItem>
                <SelectItem value="role:PROFESOR">Todos los profesores</SelectItem>
                {staff.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Personas
                    </div>
                    {staff.map((p) => (
                      <SelectItem key={p.id} value={`user:${p.id}`}>
                        {p.name} · {p.role.toLowerCase()}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Creando…" : "Crear tarea"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
