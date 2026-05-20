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

export function CreateNoticeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
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
    setLoading(true);
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo publicar el aviso");
      return;
    }
    toast.success("Aviso publicado");
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
      <DialogContent>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Publicando…" : "Publicar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
