"use client";
import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Link as LinkIcon, Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resizeImageToDataUrl } from "@/lib/resize-image";

const TITLES = ["DT", "Ayudante", "Preparador físico", "Coordinador", "Otro"] as const;

function dicebearUrl(name: string): string {
  const seed = encodeURIComponent(name.trim() || "profesor");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=dc2626&textColor=ffffff`;
}

function initials(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

type Props = {
  initialFirstName?: string;
  initialLastName?: string;
  email: string;
  assignedCategoriesCount: number;
  assignedCategoryNames: string[];
};

type PhotoMode = "auto" | "upload" | "url";

export function OnboardingForm({
  initialFirstName,
  initialLastName,
  email,
  assignedCategoriesCount,
  assignedCategoryNames,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState<typeof TITLES[number] | "">("");
  const [photoMode, setPhotoMode] = useState<PhotoMode>("auto");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const previewPhoto = useMemo(() => {
    if (photoMode === "upload" && photoDataUrl) return photoDataUrl;
    if (photoMode === "url" && photoUrl.trim()) return photoUrl.trim();
    return dicebearUrl(`${firstName} ${lastName}`);
  }, [photoMode, photoDataUrl, photoUrl, firstName, lastName]);

  function resolvedPhotoValue(): string {
    if (photoMode === "upload" && photoDataUrl) return photoDataUrl;
    if (photoMode === "url") return photoUrl.trim();
    return "";
  }

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Tiene que ser una imagen");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es muy grande (máx 10 MB)");
      return;
    }
    setPhotoLoading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPhotoDataUrl(dataUrl);
      setPhotoMode("upload");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo procesar la imagen");
    } finally {
      setPhotoLoading(false);
    }
  }

  function clearPhoto() {
    setPhotoMode("auto");
    setPhotoDataUrl("");
    setPhotoUrl("");
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Completá tu nombre y apellido");
      return;
    }
    if (phone.trim().length < 6) {
      toast.error("Ingresá un teléfono válido");
      return;
    }
    if (!title) {
      toast.error("Elegí tu cargo");
      return;
    }
    const photoVal = resolvedPhotoValue();
    if (photoMode === "url" && photoVal && !/^https?:\/\//i.test(photoVal)) {
      toast.error("La URL de la foto tiene que empezar con http:// o https://");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/profesor/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        title,
        photo: photoVal,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No pudimos guardar tu perfil");
      return;
    }
    toast.success(`Bienvenido, ${firstName}`);
    router.push("/profesor");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Hero con avatar previsualizado */}
      <div className="flex flex-col items-center text-center gap-3">
        <Avatar className="h-20 w-20 ring-2 ring-rose-100">
          <AvatarImage src={previewPhoto} alt="Foto de perfil" />
          <AvatarFallback className="text-lg">{initials(firstName, lastName)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold leading-tight">Completá tu perfil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {assignedCategoriesCount === 0
              ? "Antes de arrancar, necesitamos algunos datos tuyos."
              : assignedCategoriesCount === 1
              ? `Vas a estar a cargo de ${assignedCategoryNames[0]}. Necesitamos algunos datos.`
              : `Vas a estar a cargo de ${assignedCategoriesCount} categorías. Necesitamos algunos datos.`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first">Nombre</Label>
          <Input
            id="first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Juan"
            maxLength={60}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last">Apellido</Label>
          <Input
            id="last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Pérez"
            maxLength={60}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="11 5555-5555"
          maxLength={30}
          autoComplete="tel"
          inputMode="tel"
        />
        <p className="text-[11px] text-muted-foreground">
          Lo usamos para contactarte por temas de la categoría. No es público.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Cargo</Label>
        <Select value={title} onValueChange={(v) => setTitle(v as typeof TITLES[number])}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí tu cargo" />
          </SelectTrigger>
          <SelectContent>
            {TITLES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Foto opcional — file picker (cámara/galería) + URL como alternativa */}
      <div className="space-y-2 rounded-md border bg-muted/20 p-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Foto de perfil (opcional)
        </Label>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />

        {photoMode === "upload" && photoDataUrl ? (
          <div className="flex items-center gap-2 rounded-md bg-background border p-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={photoDataUrl} alt="Tu foto" />
              <AvatarFallback>{initials(firstName, lastName)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground flex-1">Foto cargada ✓</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={clearPhoto}
              aria-label="Quitar foto"
              className="text-muted-foreground hover:text-rose-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : photoMode === "url" ? (
          <>
            <Input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Pegá la URL de una foto tuya.
              </p>
              <button
                type="button"
                onClick={() => setPhotoMode("auto")}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Volver
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={photoLoading}
                className="flex-1 gap-2 h-10"
              >
                {photoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Sacar / subir foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPhotoMode("url")}
                className="gap-2 h-10"
              >
                <LinkIcon className="h-4 w-4" /> URL
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              En el celular podés sacar la foto al momento. Si no, usamos un avatar con tus iniciales.
            </p>
          </>
        )}
      </div>

      <div className="pt-2 space-y-2">
        <Button onClick={submit} disabled={loading} className="w-full gap-2" size="lg">
          {loading ? "Guardando…" : (
            <>
              Entrar al panel <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          Sesión iniciada como <span className="font-mono">{email}</span>
        </p>
      </div>
    </div>
  );
}
