"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Heart } from "lucide-react";
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

const RELATIONS = ["Padre", "Madre", "Tutor/a", "Abuelo/a", "Otro"] as const;

type Props = {
  initialFirstName?: string;
  initialLastName?: string;
  email: string;
  /** Cuántos hijos están vinculados al padre */
  childrenCount: number;
};

export function OnboardingForm({ initialFirstName, initialLastName, email, childrenCount }: Props) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName, setLastName] = useState(initialLastName ?? "");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState<typeof RELATIONS[number] | "">("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Completá tu nombre y apellido");
      return;
    }
    if (phone.trim().length < 6) {
      toast.error("Ingresá un teléfono válido");
      return;
    }
    if (!relation) {
      toast.error("Elegí tu relación con el chico/a");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/padre/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        relation,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No pudimos guardar tus datos");
      return;
    }
    toast.success(`Bienvenido, ${firstName}`);
    router.push("/padre");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-barrancas-red mb-3">
          <Heart className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold leading-tight">Completá tus datos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {childrenCount === 1
            ? "Te invitaron como familia de un jugador. Necesitamos algunos datos para contactarte."
            : childrenCount > 1
            ? `Te invitaron como familia de ${childrenCount} jugadores. Necesitamos algunos datos para contactarte.`
            : "Necesitamos algunos datos para contactarte."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="first">Nombre</Label>
          <Input
            id="first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="María"
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
          Lo usamos para mandarte recordatorios de cuotas o avisos urgentes por WhatsApp.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>¿Cuál es tu relación con el chico/a?</Label>
        <Select value={relation} onValueChange={(v) => setRelation(v as typeof RELATIONS[number])}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí una opción" />
          </SelectTrigger>
          <SelectContent>
            {RELATIONS.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2 space-y-2">
        <Button onClick={submit} disabled={loading} className="w-full gap-2" size="lg">
          {loading ? "Guardando…" : (
            <>
              Entrar al portal <ArrowRight className="h-4 w-4" />
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
