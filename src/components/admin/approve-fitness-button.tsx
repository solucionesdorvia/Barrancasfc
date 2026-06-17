"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Upload, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
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
import { resizeImageToDataUrl } from "@/lib/resize-image";

function defaultExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function ApproveFitnessButton({
  playerId,
  currentExpiry,
}: {
  playerId: string;
  currentExpiry: Date | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [docDataUrl, setDocDataUrl] = useState("");
  const [docMeta, setDocMeta] = useState<{ name: string; size: number; kind: "image" | "pdf" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (o) {
      setExpiry(currentExpiry ? currentExpiry.toISOString().slice(0, 10) : defaultExpiry());
    } else {
      setDocDataUrl("");
      setDocMeta(null);
    }
  }

  async function onFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Solo aceptamos imagen (JPG/PNG/HEIC) o PDF");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("El archivo es muy grande (máx 8 MB)");
      return;
    }
    setFileLoading(true);
    try {
      let dataUrl: string;
      if (isImage) {
        dataUrl = await resizeImageToDataUrl(file, 1200, 0.8);
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(new Error("No se pudo leer el archivo"));
          r.readAsDataURL(file);
        });
      }
      setDocDataUrl(dataUrl);
      setDocMeta({ name: file.name, size: file.size, kind: isPdf ? "pdf" : "image" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo leer el archivo");
    } finally {
      setFileLoading(false);
    }
  }

  async function submit() {
    if (!expiry) {
      toast.error("Ingresá la fecha de vencimiento");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/approve-fitness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expiry,
        documentDataUrl: docDataUrl || undefined,
        documentName: docMeta?.name?.replace(/\.[^.]+$/, "") || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo registrar el apto");
      return;
    }
    toast.success(docDataUrl ? "Apto físico cargado con certificado" : "Apto físico cargado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          {currentExpiry ? "Renovar apto" : "Cargar apto"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentExpiry ? "Renovar apto físico" : "Cargar apto físico"}</DialogTitle>
          <DialogDescription>
            Ingresá la fecha de vencimiento del nuevo certificado. Si tenés el documento, podés
            adjuntarlo abajo (se guarda como ficha médica del jugador).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Vence el</Label>
            <Input
              id="expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {/* Adjuntar certificado (opcional) */}
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Certificado (opcional)
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            {docMeta && docDataUrl ? (
              <div className="flex items-center gap-3 rounded-md bg-background border p-2">
                <div className="h-9 w-9 rounded-md bg-violet-100 text-violet-700 grid place-items-center shrink-0">
                  {docMeta.kind === "pdf" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{docMeta.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {docMeta.kind === "pdf" ? "PDF" : "Imagen"} · {(docMeta.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDocDataUrl(""); setDocMeta(null); }}
                  aria-label="Quitar archivo"
                  className="text-muted-foreground hover:text-rose-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={fileLoading}
                  className="w-full gap-2 h-10"
                >
                  {fileLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Adjuntar foto o PDF del certificado
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  En el celular abre la cámara directo. La foto se guarda como ficha médica del jugador.
                </p>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Guardando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
