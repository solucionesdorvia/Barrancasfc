"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resizeImageToDataUrl } from "@/lib/resize-image";

const DOC_TYPES = [
  { value: "DNI_FRONT", label: "DNI — Frente" },
  { value: "DNI_BACK", label: "DNI — Dorso" },
  { value: "DNI", label: "DNI (único archivo)" },
  { value: "BIRTH_CERT", label: "Partida de nacimiento" },
  { value: "MEDICAL", label: "Ficha médica / Apto físico" },
  { value: "PARENT_DOC", label: "Documentación del padre/tutor" },
  { value: "REPORT_CARD", label: "Boletín / Constancia escolar" },
  { value: "OTHER", label: "Otro" },
] as const;

type Player = { id: string; firstName: string; lastName: string };

type Props = {
  /** Player fijo (uso desde la ficha) o lista para elegir (uso desde /admin/documents). */
  player?: Player;
  players?: Player[];
  /** Trigger custom (sino usa "Subir documento" default). */
  trigger?: React.ReactNode;
};

async function fileToDataUrl(file: File): Promise<string> {
  // Imágenes: resize a 1200×1200 JPEG 80% (legible para DNI/apto).
  // PDFs y otros: lectura directa sin tocar.
  if (file.type.startsWith("image/")) {
    return await resizeImageToDataUrl(file, 1200, 0.8);
  }
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}

export function UploadDocumentButton({ player, players, trigger }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState<string>(player?.id ?? "");
  const [type, setType] = useState<typeof DOC_TYPES[number]["value"] | "">("");
  const [name, setName] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; kind: "image" | "pdf" } | null>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setPlayerId(player?.id ?? "");
    setType("");
    setName("");
    setFileMeta(null);
    setDataUrl("");
  }

  async function onFile(file: File) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Solo aceptamos imágenes (JPG, PNG, HEIC) o PDF");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("El archivo es muy grande (máx 8 MB)");
      return;
    }
    setLoading(true);
    try {
      const url = await fileToDataUrl(file);
      setDataUrl(url);
      setFileMeta({ name: file.name, size: file.size, kind: isPdf ? "pdf" : "image" });
      // Auto-name si está vacío
      if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo leer el archivo");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    const targetPid = player?.id ?? playerId;
    if (!targetPid) {
      toast.error("Elegí el jugador");
      return;
    }
    if (!type) {
      toast.error("Elegí qué tipo de documento es");
      return;
    }
    if (!dataUrl) {
      toast.error("Subí un archivo");
      return;
    }
    if (name.trim().length < 1) {
      toast.error("Poné un nombre al documento");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${targetPid}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type, dataUrl }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo subir el documento");
      return;
    }
    toast.success("Documento subido");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Upload className="h-4 w-4" /> Subir documento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>
            {player
              ? `Para ${player.firstName} ${player.lastName}.`
              : "Elegí el jugador, el tipo y subí el archivo."}{" "}
            Acepta imágenes (JPG/PNG/HEIC) y PDFs.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Selector de jugador solo si vino lista */}
          {!player && players && (
            <div className="space-y-1.5">
              <Label>Jugador</Label>
              <Select value={playerId} onValueChange={setPlayerId}>
                <SelectTrigger><SelectValue placeholder="Elegí un jugador" /></SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.lastName}, {p.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipo de documento</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue placeholder="Elegí qué documento es" /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-name">
              Nombre <span className="text-xs text-muted-foreground font-normal">(para identificarlo)</span>
            </Label>
            <Input
              id="doc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: DNI Filippo frente"
              maxLength={120}
            />
          </div>

          {/* File picker */}
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

          {fileMeta ? (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <div className="h-10 w-10 rounded-md bg-violet-100 text-violet-700 grid place-items-center shrink-0">
                {fileMeta.kind === "pdf" ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileMeta.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fileMeta.kind === "pdf" ? "PDF" : "Imagen"} · {(fileMeta.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setDataUrl(""); setFileMeta(null); }}
                aria-label="Quitar archivo"
                className="text-muted-foreground hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full h-12 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Elegir archivo
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || !dataUrl}>
            {loading ? "Subiendo…" : "Subir documento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
