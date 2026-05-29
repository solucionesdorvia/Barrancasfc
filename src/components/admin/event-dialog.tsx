"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

// Lunes a Domingo (orden argentino). El número corresponde al .getDay() de JS
// (0=Dom ... 6=Sab) para el backend.
const DAYS_OF_WEEK = [
  { label: "L", value: 1 },
  { label: "M", value: 2 },
  { label: "X", value: 3 },
  { label: "J", value: 4 },
  { label: "V", value: 5 },
  { label: "S", value: 6 },
  { label: "D", value: 0 },
];

function defaultDateString() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  // datetime-local quiere YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDialog({
  categories,
  defaultDate,
}: {
  categories: Category[];
  defaultDate?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: defaultDate ?? defaultDateString(),
    location: "",
    type: "TRAINING",
    audience: "ALL",
    categoryId: "_none",
    // recurrencia
    repeat: false,
    repeatType: "WEEKLY" as "DAILY" | "WEEKLY",
    daysOfWeek: [] as number[],
    repeatUntil: "",
  });

  function reset() {
    setForm({
      title: "",
      description: "",
      date: defaultDate ?? defaultDateString(),
      location: "",
      type: "TRAINING",
      audience: "ALL",
      categoryId: "_none",
      repeat: false,
      repeatType: "WEEKLY",
      daysOfWeek: [],
      repeatUntil: "",
    });
  }

  function toggleDay(d: number) {
    setForm((f) => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter((x) => x !== d) : [...f.daysOfWeek, d],
    }));
  }

  async function submit() {
    if (!form.title.trim() || !form.date) {
      toast.error("Completá título y fecha");
      return;
    }
    if (form.repeat && !form.repeatUntil) {
      toast.error("Indicá hasta qué fecha se repite");
      return;
    }
    if (form.repeat && form.repeatType === "WEEKLY" && form.daysOfWeek.length === 0) {
      toast.error("Elegí al menos un día de la semana");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        date: new Date(form.date).toISOString(),
        location: form.location || undefined,
        type: form.type,
        audience: form.audience,
        categoryId: form.audience === "CATEGORY" && form.categoryId !== "_none" ? form.categoryId : null,
        repeatType: form.repeat ? form.repeatType : "NONE",
        daysOfWeek: form.repeat && form.repeatType === "WEEKLY" ? form.daysOfWeek : [],
        repeatUntil: form.repeat && form.repeatUntil
          ? new Date(form.repeatUntil + "T23:59:59").toISOString()
          : null,
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo crear el evento");
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (data?.count && data.count > 1) {
      toast.success(`Serie creada · ${data.count} eventos`);
    } else {
      toast.success("Evento creado");
    }
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2"><CalendarPlus className="h-4 w-4" /> Nuevo evento</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear evento</DialogTitle>
          <DialogDescription>Va al calendario y se notifica a la audiencia seleccionada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Entrenamiento Infantil 2012" maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha y hora *</Label>
              <Input id="date" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRAINING">Entrenamiento</SelectItem>
                  <SelectItem value="MATCH">Partido</SelectItem>
                  <SelectItem value="MEETING">Reunión</SelectItem>
                  <SelectItem value="NOTICE">Aviso</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Lugar</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Cancha principal" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="audience">Audiencia</Label>
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="ADMIN">Admin / staff</SelectItem>
                  <SelectItem value="PROFESOR">Profesores</SelectItem>
                  <SelectItem value="PADRE">Padres</SelectItem>
                  <SelectItem value="CATEGORY">Categoría específica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience === "CATEGORY" && (
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Categoría</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Elegí" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Recurrencia */}
          <div className="rounded-md border bg-muted/30 p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.repeat}
                onChange={(e) => setForm({ ...form, repeat: e.target.checked })}
                className="h-4 w-4 rounded accent-barrancas-red"
              />
              <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">Repetir este evento</span>
            </label>

            {form.repeat && (
              <div className="space-y-2.5 pl-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frecuencia</Label>
                    <Select value={form.repeatType} onValueChange={(v) => setForm({ ...form, repeatType: v as "DAILY" | "WEEKLY" })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Todos los días</SelectItem>
                        <SelectItem value="WEEKLY">Por día de la semana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs" htmlFor="repeatUntil">Hasta</Label>
                    <Input
                      id="repeatUntil"
                      type="date"
                      value={form.repeatUntil}
                      onChange={(e) => setForm({ ...form, repeatUntil: e.target.value })}
                      min={form.date.slice(0, 10)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {form.repeatType === "WEEKLY" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Días</Label>
                    <div className="flex gap-1">
                      {DAYS_OF_WEEK.map((d) => {
                        const active = form.daysOfWeek.includes(d.value);
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => toggleDay(d.value)}
                            className={cn(
                              "h-8 w-8 rounded-md text-xs font-semibold transition-colors",
                              active
                                ? "bg-barrancas-red text-white"
                                : "bg-background border text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Se crean varios eventos automáticamente. Después podés borrar la serie completa o eventos sueltos.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles, observaciones, etc." maxLength={2000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {form.repeat ? "Crear serie" : "Crear evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
