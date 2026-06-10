"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
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

type Props = {
  playerId: string;
  initialPhoto: string | null;
  initialsLabel: string;
  /** Solo admin puede editar; otros roles ven el avatar sin botón */
  canEdit: boolean;
};

/**
 * Avatar grande del jugador con botón de cámara para editar la foto.
 * Por ahora acepta URL — para upload real con archivo se agregará en el
 * próximo iteración con uploadthing. El input ya permite pegar links de
 * Drive, WhatsApp Web, etc. que el club use.
 */
export function PlayerPhotoEditor({ playerId, initialPhoto, initialsLabel, canEdit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialPhoto ?? "");
  const [loading, setLoading] = useState(false);

  async function save(newUrl: string | null) {
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/photo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: newUrl }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo guardar la foto");
      return;
    }
    toast.success(newUrl ? "Foto actualizada" : "Foto eliminada");
    setOpen(false);
    router.refresh();
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
            onClick={() => setOpen(true)}
            aria-label="Cambiar foto del jugador"
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-barrancas-red text-white grid place-items-center shadow-md hover:scale-105 transition-transform"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar foto del jugador</DialogTitle>
            <DialogDescription>
              Pegá la URL de una foto. Si la dejás vacía, vuelve al avatar con sus iniciales.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 ring-2 ring-rose-100">
                <AvatarImage src={url || undefined} alt="Preview" />
                <AvatarFallback className="text-lg">{initialsLabel}</AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="photo-url">URL de la foto</Label>
              <Input
                id="photo-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                inputMode="url"
              />
              <p className="text-[11px] text-muted-foreground">
                Pegá una URL de imagen pública (Drive con acceso, WhatsApp Web, etc.).
              </p>
            </div>
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
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => save(url.trim() || null)}
              disabled={loading}
            >
              {loading ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
