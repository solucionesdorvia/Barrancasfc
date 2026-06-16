"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Trash2, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { resizeImageToDataUrl } from "@/lib/resize-image";

type Props = {
  playerId: string;
  initialPhoto: string | null;
  initialsLabel: string;
  canEdit: boolean;
};

export function PlayerPhotoEditor({ playerId, initialPhoto, initialsLabel, canEdit }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(initialPhoto);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setPreview(initialPhoto);
    setUrlInput("");
    setMode("upload");
  }

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Tiene que ser una imagen (JPG, PNG, HEIC, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es muy grande (máx 10 MB)");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreview(dataUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo procesar la imagen");
    } finally {
      setLoading(false);
    }
  }

  async function save(value: string | null) {
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/photo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: value }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo guardar la foto");
      return;
    }
    toast.success(value ? "Foto actualizada" : "Foto eliminada");
    setOpen(false);
    router.refresh();
  }

  function onSave() {
    if (mode === "url") {
      const trimmed = urlInput.trim();
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        toast.error("La URL tiene que empezar con http:// o https://");
        return;
      }
      save(trimmed || null);
    } else {
      // Si preview no cambió, no enviamos nada
      if (preview === initialPhoto) {
        setOpen(false);
        return;
      }
      save(preview);
    }
  }

  return (
    <>
      <div className="relative shrink-0">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-zinc-100">
          <AvatarImage src={initialPhoto ?? undefined} alt={`Foto de ${initialsLabel}`} />
          <AvatarFallback className="text-lg">{initialsLabel}</AvatarFallback>
        </Avatar>
        {canEdit && (
          <button
            type="button"
            onClick={() => { reset(); setOpen(true); }}
            aria-label="Cambiar foto del jugador"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-barrancas-red text-white grid place-items-center shadow-md hover:scale-105 transition-transform"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar foto del jugador</DialogTitle>
            <DialogDescription>
              Subí una foto desde tus archivos o cámara. Si dejás vacío, vuelve al avatar con iniciales.
            </DialogDescription>
          </DialogHeader>

          {/* Toggle modo: subir / URL */}
          <div className="inline-flex rounded-md border p-0.5 self-start">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`px-3 py-1 text-xs font-medium rounded gap-1.5 inline-flex items-center transition-colors ${
                mode === "upload" ? "bg-barrancas-red text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-3 w-3" /> Subir archivo
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`px-3 py-1 text-xs font-medium rounded gap-1.5 inline-flex items-center transition-colors ${
                mode === "url" ? "bg-barrancas-red text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="h-3 w-3" /> Pegar URL
            </button>
          </div>

          <div className="space-y-4">
            {/* Preview siempre visible */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 ring-2 ring-rose-100">
                <AvatarImage
                  src={(mode === "url" ? urlInput : preview) || undefined}
                  alt="Preview"
                />
                <AvatarFallback className="text-lg">{initialsLabel}</AvatarFallback>
              </Avatar>
            </div>

            {mode === "upload" ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full gap-2 h-12"
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {preview && preview !== initialPhoto ? "Elegir otra foto" : "Elegir foto desde el dispositivo"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Aceptamos JPG, PNG y HEIC. La foto se ajusta automáticamente a 400×400 para que cargue rápido.
                </p>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="photo-url">URL de la foto</Label>
                <Input
                  id="photo-url"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                />
                <p className="text-[11px] text-muted-foreground">
                  Pegá una URL de imagen pública (Drive con acceso, WhatsApp Web, etc.).
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            {initialPhoto && (
              <Button
                variant="outline"
                onClick={() => save(null)}
                disabled={loading}
                className="gap-2 text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" /> Quitar foto
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={onSave} disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
