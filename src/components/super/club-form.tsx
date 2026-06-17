"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export type ClubFormValues = {
  slug: string;
  name: string;
  logo: string;
  tagline: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  contactWhatsapp: string;
  contactEmail: string;
};

const DEFAULTS: ClubFormValues = {
  slug: "",
  name: "",
  logo: "",
  tagline: "",
  primary: "#0F766E",
  primaryHover: "#0B574F",
  primarySoft: "#D7F0E8",
  onPrimary: "#E1F5EE",
  accent: "#F97316",
  contactWhatsapp: "",
  contactEmail: "",
};

export function ClubForm({
  initial,
  clubId,
}: {
  initial?: Partial<ClubFormValues>;
  /** Si viene clubId hace PATCH; sino POST de creación. */
  clubId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ClubFormValues>({ ...DEFAULTS, ...initial });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ClubFormValues>(k: K, v: ClubFormValues[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (form.slug.trim().length < 2) {
      toast.error("El slug es obligatorio (al menos 2 chars)");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      toast.error("El slug solo puede tener minúsculas, números y guiones");
      return;
    }

    setLoading(true);
    const url = clubId ? `/api/super/clubs/${clubId}` : "/api/super/clubs";
    const method = clubId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo guardar");
      return;
    }
    const data = await res.json().catch(() => null);
    toast.success(clubId ? "Club actualizado" : "Club creado");
    if (!clubId && data?.id) {
      router.push(`/super/clubs/${data.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <SectionTitle>Identidad</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Slug (subdomain)"
              value={form.slug}
              onChange={(v) => set("slug", v.toLowerCase())}
              placeholder="riestra"
              hint="Quedará accesible en {slug}.nexclub.app — minúsculas, números y guiones"
              disabled={!!clubId}
            />
            <Field label="Nombre del club" value={form.name} onChange={(v) => set("name", v)} placeholder="Deportivo Riestra" />
            <Field label="Logo (URL pública)" value={form.logo} onChange={(v) => set("logo", v)} placeholder="https://…" />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} placeholder="Inferiores · CABA" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <SectionTitle>Paleta de colores</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColorField label="Primary" value={form.primary} onChange={(v) => set("primary", v)} />
            <ColorField label="Primary hover" value={form.primaryHover} onChange={(v) => set("primaryHover", v)} />
            <ColorField label="Primary soft" value={form.primarySoft} onChange={(v) => set("primarySoft", v)} />
            <ColorField label="On primary (texto sobre primary)" value={form.onPrimary} onChange={(v) => set("onPrimary", v)} />
            <ColorField label="Accent" value={form.accent} onChange={(v) => set("accent", v)} />
          </div>
          <Preview brand={form} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <SectionTitle>Contacto (templates de WhatsApp / mail)</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="WhatsApp" value={form.contactWhatsapp} onChange={(v) => set("contactWhatsapp", v)} placeholder="+54 9 11 …" />
            <Field label="Email" value={form.contactEmail} onChange={(v) => set("contactEmail", v)} placeholder="admin@club.com" />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Button onClick={submit} disabled={loading} className="w-full h-12 gap-2 shadow-lg bg-nex hover:bg-nex-hover text-white">
          <Save className="h-4 w-4" />
          {loading ? "Guardando…" : clubId ? "Guardar cambios" : "Crear club"}
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">{children}</p>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
      {hint && <p className="text-[10px] text-nex-muted">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0F766E"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-12 rounded-md border border-input cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#0F766E" className="font-mono text-sm" />
      </div>
    </div>
  );
}

function Preview({ brand }: { brand: ClubFormValues }) {
  return (
    <div className="rounded-md border bg-nex-soft/40 p-4">
      <p className="text-[10px] uppercase tracking-widest text-nex-muted mb-3">Vista previa</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: brand.primary }}
        >
          Botón primary
        </button>
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ background: brand.primarySoft, color: brand.primary }}
        >
          Badge soft
        </span>
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ background: brand.accent }}
        >
          Accent
        </span>
      </div>
    </div>
  );
}

/** Atajo para abrir el subdomain del club en una nueva pestaña. */
export function OpenClubLink({ slug, rootDomain }: { slug: string; rootDomain: string }) {
  return (
    <a
      href={`https://${slug}.${rootDomain}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-nex hover:underline"
    >
      Abrir {slug}.{rootDomain} <ExternalLink className="h-3 w-3" />
    </a>
  );
}
