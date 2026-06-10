import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  ImageOff,
  IdCard,
  Phone,
  ChevronRight,
  ArrowUpRight,
  Heart,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/admin/kpi-card";
import { formatRelative, formatDate, initials, fullName, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  DNI: "DNI",
  BIRTH_CERT: "Partida de nacimiento",
  MEDICAL: "Ficha médica",
  REPORT_CARD: "Boletín",
  OTHER: "Otro",
};

type CheckKey = "dni" | "photo" | "fitness" | "address" | "phone" | "healthIns" | "parent" | "documents";

const CHECK_LABEL: Record<CheckKey, string> = {
  dni: "DNI",
  photo: "Foto",
  fitness: "Apto físico",
  address: "Domicilio",
  phone: "Teléfono",
  healthIns: "Obra social",
  parent: "Tutor vinculado",
  documents: "Documentación",
};

export default async function DocumentsPage() {
  // Plantel activo con todas las flags que vamos a contar
  const players = await prisma.player.findMany({
    where: { status: "ACTIVE", category: { type: { not: "PROFESIONAL" } } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      dni: true,
      address: true,
      personalPhone: true,
      hasHealthInsurance: true,
      fitnessExpiry: true,
      category: { select: { name: true } },
      _count: { select: { parents: true, documents: true } },
    },
    orderBy: [{ lastName: "asc" }],
  });

  const total = players.length;
  const now = new Date();

  // Calcular las flags de completitud por jugador
  const enriched = players.map((p) => {
    const checks: Record<CheckKey, boolean> = {
      dni: !!p.dni && p.dni.length >= 7,
      photo: !!p.photo,
      fitness: !!p.fitnessExpiry && new Date(p.fitnessExpiry) > now,
      address: !!p.address,
      phone: !!p.personalPhone,
      healthIns: p.hasHealthInsurance,
      parent: p._count.parents > 0,
      documents: p._count.documents > 0,
    };
    const ok = (Object.values(checks) as boolean[]).filter(Boolean).length;
    return { ...p, checks, ok, missing: 8 - ok };
  });

  // KPIs globales (%)
  const pct = (k: CheckKey) =>
    total === 0 ? 0 : Math.round((enriched.filter((p) => p.checks[k]).length / total) * 100);

  const kpis = [
    { label: "Con DNI", value: `${pct("dni")}%`, icon: IdCard, tone: pct("dni") >= 80 ? "success" : "warning" },
    { label: "Con foto", value: `${pct("photo")}%`, icon: ImageOff, tone: pct("photo") >= 80 ? "success" : "warning" },
    { label: "Apto al día", value: `${pct("fitness")}%`, icon: ShieldCheck, tone: pct("fitness") >= 80 ? "success" : "danger" },
    { label: "Con tutor", value: `${pct("parent")}%`, icon: Heart, tone: pct("parent") >= 80 ? "success" : "warning" },
    { label: "Con teléfono", value: `${pct("phone")}%`, icon: Phone, tone: "default" },
    { label: "Con domicilio", value: `${pct("address")}%`, icon: FileText, tone: "default" },
  ] as const;

  // Top 15 jugadores con MÁS faltantes para enfocar acción
  const topMissing = enriched.filter((p) => p.missing > 0).sort((a, b) => b.missing - a.missing).slice(0, 15);

  // Documentos subidos recientes (mantener vista histórica)
  const docs = await prisma.document.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      uploadedAt: true,
      uploadedBy: true,
      player: { select: { id: true, firstName: true, lastName: true, photo: true } },
    },
    orderBy: { uploadedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documentación"
        description={`${total} jugadores activos · ${pluralize(total, "estado")} de completitud del plantel`}
      />

      {/* KPIs de completitud */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} icon={k.icon} tone={k.tone} />
        ))}
      </div>

      {/* Jugadores con mayor faltante */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30">
          <CardTitle className="text-base">Jugadores con datos faltantes</CardTitle>
          <CardDescription>
            Top {topMissing.length} ordenados por cantidad de items pendientes. Tocá uno para completar.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {topMissing.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Plantel 100% completo"
              description="Todos los jugadores tienen los datos básicos cargados."
              bare
              className="py-10"
            />
          ) : (
            <div className="divide-y">
              {topMissing.map((p) => {
                const missingLabels = (Object.entries(p.checks) as [CheckKey, boolean][])
                  .filter(([, ok]) => !ok)
                  .map(([k]) => CHECK_LABEL[k]);
                return (
                  <Link
                    key={p.id}
                    href={`/admin/players/${p.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={p.photo ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {initials(fullName(p.firstName, p.lastName))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{p.lastName}, {p.firstName}</p>
                        <Badge variant="outline" className="text-[10px] shrink-0">{p.category.name}</Badge>
                      </div>
                      <div className="flex items-center flex-wrap gap-1 mt-1">
                        {missingLabels.map((m) => (
                          <Badge key={m} variant="danger" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold tabular-nums text-rose-600">{p.missing}/8</p>
                      <p className="text-[10px] text-muted-foreground">faltan</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentos subidos recientes */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30">
          <CardTitle className="text-base">Documentos subidos recientemente</CardTitle>
          <CardDescription>
            Los padres suben docs desde su portal. Acá aparecen los últimos {docs.length}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sin documentos subidos todavía"
              description="Los padres pueden subir DNI, fichas médicas y otros desde el portal padre."
              bare
              className="py-10"
            />
          ) : (
            <div className="divide-y">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 grid place-items-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{d.name || "Sin nombre"}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{DOC_TYPE_LABEL[d.type] ?? d.type}</Badge>
                    </div>
                    <Link
                      href={`/admin/players/${d.player.id}`}
                      className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:underline mt-0.5"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={d.player.photo ?? undefined} />
                        <AvatarFallback className="text-[8px]">
                          {initials(fullName(d.player.firstName, d.player.lastName))}
                        </AvatarFallback>
                      </Avatar>
                      {d.player.firstName} {d.player.lastName}
                      <span className="opacity-50">·</span>
                      <span title={formatDate(d.uploadedAt)}>{formatRelative(d.uploadedAt)}</span>
                    </Link>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="shrink-0 gap-1">
                    <a href={d.url} target="_blank" rel="noopener noreferrer">
                      Ver <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
