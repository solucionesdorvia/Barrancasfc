"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
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

type Category = { id: string; name: string };

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
    date: defaultDate ?? new Date().toISOString().slice(0, 16),
    location: "",
    type: "TRAINING",
    audience: "ALL",
    categoryId: "_none",
  });

  function reset() {
    setForm({
      title: "",
      description: "",
      date: defaultDate ?? new Date().toISOString().slice(0, 16),
      location: "",
      type: "TRAINING",
      audience: "ALL",
      categoryId: "_none",
    });
  }

  async function submit() {
    if (!form.title.trim() || !form.date) {
      toast.error("Completá título y fecha");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: new Date(form.date).toISOString(),
        location: form.location || undefined,
        description: form.description || undefined,
        categoryId: form.categoryId === "_none" ? null : form.categoryId,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo crear el evento");
      return;
    }
    toast.success("Evento creado");
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
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles, observaciones, etc." maxLength={2000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
