"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  afaId: string | null;
  birthDate: Date | string;
  nationality: string;
  citizenship: string | null;
  observations: string | null;
  address: string | null;
  locality: string | null;
  province: string | null;
  personalPhone: string | null;
  personalEmail: string | null;
  notificationEmail: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  emergencyContactEmail: string | null;
  hasHealthInsurance: boolean;
  healthInsurance: string | null;
  healthInsurancePlan: string | null;
  healthInsuranceNumber: string | null;
  schoolName: string | null;
  schoolStatus: string | null;
  schoolShift: string | null;
  schoolStartTime: string | null;
  schoolEndTimeTuesday: string | null;
  schoolEndTimeWednesday: string | null;
  schoolEndTimeThursday: string | null;
  schoolEndTimeFriday: string | null;
  clothingPaid: boolean;
  transferStatus: string | null;
  registeredIn2025: boolean;
  lastInstallmentNote: string | null;
  scholarshipType: string | null;
  scholarshipPercent: number | null;
};

const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
  "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones",
  "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
  "Santiago del Estero", "Tierra del Fuego", "Tucumán",
];

const RELATIONS = ["Padre", "Madre", "Hermano/a", "Abuelo/a", "Tío/a", "Tutor/a", "Otro"];

const INSURANCES = ["OSDE", "Swiss Medical", "IOMA", "Galeno", "OSPe", "Medifé", "Sancor Salud", "PAMI", "Otra"];

function toLocalDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

export function PlayerProfileForm({ player, isAdmin }: { player: Player; isAdmin: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: player.firstName,
    lastName: player.lastName,
    dni: player.dni ?? "",
    birthDate: toLocalDate(player.birthDate),
    nationality: player.nationality ?? "Argentina",
    citizenship: player.citizenship ?? "",
    observations: player.observations ?? "",
    address: player.address ?? "",
    locality: player.locality ?? "",
    province: player.province ?? "",
    personalPhone: player.personalPhone ?? "",
    personalEmail: player.personalEmail ?? "",
    notificationEmail: player.notificationEmail ?? "",
    emergencyContactName: player.emergencyContactName ?? "",
    emergencyContactRelation: player.emergencyContactRelation ?? "",
    emergencyContactPhone: player.emergencyContactPhone ?? "",
    emergencyContactEmail: player.emergencyContactEmail ?? "",
    hasHealthInsurance: player.hasHealthInsurance,
    healthInsurance: player.healthInsurance ?? "",
    healthInsurancePlan: player.healthInsurancePlan ?? "",
    healthInsuranceNumber: player.healthInsuranceNumber ?? "",
    schoolName: player.schoolName ?? "",
    schoolStatus: player.schoolStatus ?? "",
    schoolShift: player.schoolShift ?? "",
    schoolStartTime: player.schoolStartTime ?? "",
    schoolEndTimeTuesday: player.schoolEndTimeTuesday ?? "",
    schoolEndTimeWednesday: player.schoolEndTimeWednesday ?? "",
    schoolEndTimeThursday: player.schoolEndTimeThursday ?? "",
    schoolEndTimeFriday: player.schoolEndTimeFriday ?? "",
    clothingPaid: player.clothingPaid,
    transferStatus: player.transferStatus ?? "",
    registeredIn2025: player.registeredIn2025,
    lastInstallmentNote: player.lastInstallmentNote ?? "",
    scholarshipType: player.scholarshipType ?? "NONE",
    scholarshipPercent: player.scholarshipPercent ?? null,
  });

  const hasScholarship = form.scholarshipType !== "NONE" && form.scholarshipType !== "";

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    setSaving(true);
    const res = await fetch(`/api/players/${player.id}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo guardar");
      return;
    }
    toast.success("Perfil actualizado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Identificación (solo admin) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identificación</CardTitle>
            <CardDescription>Datos básicos del jugador</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Apellido" value={form.lastName} onChange={(v) => set("lastName", v)} />
            <Field label="Nombre" value={form.firstName} onChange={(v) => set("firstName", v)} />
            <Field label="DNI" value={form.dni} onChange={(v) => set("dni", v)} inputMode="numeric" placeholder="40123456" />
            <Field label="AFA ID" value={player.afaId ?? ""} onChange={() => {}} disabled />
            <Field label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(v) => set("birthDate", v)} />
            <Field label="Nacionalidad" value={form.nationality} onChange={(v) => set("nationality", v)} />
            <Field label="Ciudadanía" value={form.citizenship} onChange={(v) => set("citizenship", v)} placeholder="Argentina, Italiana, etc." />
          </CardContent>
        </Card>
      )}

      {/* Domicilio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domicilio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Dirección" value={form.address} onChange={(v) => set("address", v)} placeholder="Calle 123" />
          <Field label="Localidad" value={form.locality} onChange={(v) => set("locality", v)} />
          <div className="space-y-1.5 md:col-span-2">
            <Label>Provincia</Label>
            <Select value={form.province || "_none"} onValueChange={(v) => set("province", v === "_none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacto personal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto personal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Teléfono personal" value={form.personalPhone} onChange={(v) => set("personalPhone", v)} inputMode="tel" placeholder="11 5555 5555" />
          <Field label="Email personal" type="email" value={form.personalEmail} onChange={(v) => set("personalEmail", v)} placeholder="ejemplo@mail.com" />
          <div className="md:col-span-2">
            <Field label="Email para notificaciones del club" type="email" value={form.notificationEmail} onChange={(v) => set("notificationEmail", v)} placeholder="A donde te avisamos del club" />
          </div>
        </CardContent>
      </Card>

      {/* Contacto de emergencia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacto de emergencia</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nombre y apellido" value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} />
          <div className="space-y-1.5">
            <Label>Parentesco</Label>
            <Select value={form.emergencyContactRelation || "_none"} onValueChange={(v) => set("emergencyContactRelation", v === "_none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">—</SelectItem>
                {RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Field label="Teléfono" value={form.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)} inputMode="tel" />
          <Field label="Email" type="email" value={form.emergencyContactEmail} onChange={(v) => set("emergencyContactEmail", v)} />
        </CardContent>
      </Card>

      {/* Obra social */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Obra social</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.hasHealthInsurance} onCheckedChange={(v) => set("hasHealthInsurance", !!v)} />
            <span className="text-sm">Tiene obra social / prepaga</span>
          </label>
          {form.hasHealthInsurance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Obra social</Label>
                <Select value={form.healthInsurance || "_none"} onValueChange={(v) => set("healthInsurance", v === "_none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">—</SelectItem>
                    {INSURANCES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Plan" value={form.healthInsurancePlan} onChange={(v) => set("healthInsurancePlan", v)} placeholder="ej. OSDE 210" />
              <div className="md:col-span-2">
                <Field label="Número de afiliado" value={form.healthInsuranceNumber} onChange={(v) => set("healthInsuranceNumber", v)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Educación</CardTitle>
          <CardDescription>
            Para coordinar entrenamientos con horarios escolares.
            Completá solo los días que cursa — los que dejes vacíos los entendemos como días libres.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Datos generales del colegio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nivel educativo</Label>
              <Select value={form.schoolStatus || "_none"} onValueChange={(v) => set("schoolStatus", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  <SelectItem value="PRIMARIA">Primaria</SelectItem>
                  <SelectItem value="SECUNDARIA">Secundaria</SelectItem>
                  <SelectItem value="TERCIARIO">Terciario</SelectItem>
                  <SelectItem value="UNIVERSITARIO">Universitario</SelectItem>
                  <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Nombre del colegio / institución" value={form.schoolName} onChange={(v) => set("schoolName", v)} />
          </div>

          {/* Turno y entrada — opcionales para casos de doble turno */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label>Turno habitual <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
              <Select value={form.schoolShift || "_none"} onValueChange={(v) => set("schoolShift", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin turno fijo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Sin turno fijo / varía</SelectItem>
                  <SelectItem value="MANANA">Mañana</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOCHE">Noche</SelectItem>
                  <SelectItem value="DOBLE">Doble jornada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Hora de entrada (opcional)" type="time" value={form.schoolStartTime} onChange={(v) => set("schoolStartTime", v)} />
          </div>

          {/* Salidas por día — vacío significa no cursa o no hay hora fija */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Hora de salida por día
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Dejá vacío el día que no cursa. Solo cargamos los días que coinciden con entrenamientos.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <DayField label="Martes" value={form.schoolEndTimeTuesday} onChange={(v) => set("schoolEndTimeTuesday", v)} />
              <DayField label="Miércoles" value={form.schoolEndTimeWednesday} onChange={(v) => set("schoolEndTimeWednesday", v)} />
              <DayField label="Jueves" value={form.schoolEndTimeThursday} onChange={(v) => set("schoolEndTimeThursday", v)} />
              <DayField label="Viernes" value={form.schoolEndTimeFriday} onChange={(v) => set("schoolEndTimeFriday", v)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin only: estado administrativo */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado administrativo</CardTitle>
            <CardDescription>Solo visible para el admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.clothingPaid} onCheckedChange={(v) => set("clothingPaid", !!v)} />
                <span className="text-sm">Pagó la ropa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.registeredIn2025} onCheckedChange={(v) => set("registeredIn2025", !!v)} />
                <span className="text-sm">Fue jugador fichado de Barrancas en 2025</span>
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Estado del pase</Label>
              <Select value={form.transferStatus || "_none"} onValueChange={(v) => set("transferStatus", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Elegir" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  <SelectItem value="SIN_PASE">Sin pase</SelectItem>
                  <SelectItem value="EN_TRAMITE">En trámite</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Última cuota (nota interna)" value={form.lastInstallmentNote} onChange={(v) => set("lastInstallmentNote", v)} placeholder="ej. Pagó hasta agosto" />

            {/* Beca: toggle + % aplicable a la cuota mensual */}
            <div className="space-y-2 rounded-md border bg-violet-50/40 p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={hasScholarship}
                  onCheckedChange={(v) => {
                    if (v) {
                      set("scholarshipType", "PARTIAL_50");
                      set("scholarshipPercent", 50);
                    } else {
                      set("scholarshipType", "NONE");
                      set("scholarshipPercent", null);
                    }
                  }}
                />
                <span className="text-sm font-medium">Tiene beca</span>
              </label>
              {hasScholarship && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs">Tipo de beca</Label>
                  <Select
                    value={form.scholarshipType || "PARTIAL_50"}
                    onValueChange={(v) => {
                      set("scholarshipType", v);
                      const pct = v === "FULL" ? 100 : v === "PARTIAL_50" ? 50 : v === "PARTIAL_25" ? 25 : 0;
                      set("scholarshipPercent", pct);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARTIAL_25">25% de descuento</SelectItem>
                      <SelectItem value="PARTIAL_50">50% de descuento</SelectItem>
                      <SelectItem value="FULL">100% — no paga cuota</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Se aplica al generar las cuotas mensuales. La cuota del jugador refleja el descuento.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observaciones</CardTitle>
          <CardDescription>Cualquier cosa que el club deba saber</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={form.observations} onChange={(e) => set("observations", e.target.value)} maxLength={2000} placeholder="Alergia a..., toma medicación de..., etc." />
        </CardContent>
      </Card>

      {/* Sticky save */}
      <div className="sticky bottom-4 z-10">
        <Button onClick={submit} disabled={saving} className="w-full h-12 gap-2 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search" | "decimal" | "none";
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Campo de hora de salida por día. Si tiene valor lo muestra normal;
 * si está vacío lo marca como "no cursa" con UI más calmada para que
 * el padre vea de un vistazo qué días dejó libres.
 */
function DayField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] text-muted-foreground hover:text-rose-600"
          >
            limpiar
          </button>
        )}
      </div>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={value ? "" : "text-muted-foreground"}
      />
      {!value && <p className="text-[10px] text-muted-foreground">No cursa</p>}
    </div>
  );
}
