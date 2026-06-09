"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, BarChart3, X } from "lucide-react";
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

export function CreateNoticeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollClosesAt, setPollClosesAt] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
    setIsPoll(false);
    setPollOptions(["", ""]);
    setPollClosesAt("");
  }

  function updateOption(idx: number, value: string) {
    setPollOptions((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }

  function addOption() {
    if (pollOptions.length >= 6) return;
    setPollOptions((prev) => [...prev, ""]);
  }

  function removeOption(idx: number) {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (title.trim().length < 3) {
      toast.error("El título es muy corto");
      return;
    }
    if (body.trim().length < 3) {
      toast.error("El cuerpo del aviso es muy corto");
      return;
    }

    let cleanOptions: string[] = [];
    if (isPoll) {
      cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (cleanOptions.length < 2) {
        toast.error("Una encuesta necesita al menos 2 opciones con texto");
        return;
      }
    }

    setLoading(true);
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        pollOptions: cleanOptions,
        pollClosesAt: isPoll && pollClosesAt ? new Date(pollClosesAt).toISOString() : null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo publicar el aviso");
      return;
    }
    toast.success(isPoll ? "Encuesta publicada" : "Aviso publicado");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo aviso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publicar nuevo aviso</DialogTitle>
          <DialogDescription>Los padres van a verlo en su portal apenas lo publiques.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Cierre de inscripciones torneo de invierno"
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Mensaje</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Detalle del aviso…"
              rows={5}
              maxLength={2000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/2000</p>
          </div>

          {/* Toggle encuesta */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsPoll((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isPoll ? "border-barrancas-red bg-rose-50 text-barrancas-red" : "border-input hover:bg-muted/50"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {isPoll ? "Es encuesta — los padres podrán votar" : "Agregar encuesta"}
            </button>
          </div>

          {isPoll && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Opciones de votación</Label>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5 text-right">{idx + 1}.</span>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Opción ${idx + 1}`}
                    maxLength={80}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(idx)}
                      aria-label={`Eliminar opción ${idx + 1}`}
                      className="h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="gap-1.5 mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar opción
                </Button>
              )}

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="pollClosesAt" className="text-xs">Cierre de votación (opcional)</Label>
                <Input
                  id="pollClosesAt"
                  type="datetime-local"
                  value={pollClosesAt}
                  onChange={(e) => setPollClosesAt(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Si lo dejás en blanco, queda abierta hasta que la elimines.
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Publicando…" : isPoll ? "Publicar encuesta" : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
