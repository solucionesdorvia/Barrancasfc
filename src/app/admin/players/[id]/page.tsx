import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Heart,
  Calendar,
  GraduationCap,
  Wallet,
  TrendingUp,
  ShieldAlert,
  FileText,
  ClipboardCheck,
  History,
  UserCircle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ChangeCategoryButton } from "@/components/admin/change-category-button";
import { ChangeStatusButton } from "@/components/admin/change-status-button";
import { ApproveFitnessButton } from "@/components/admin/approve-fitness-button";
import { UpdateFeeButton } from "@/components/admin/update-fee-button";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { PlayerNotes } from "@/components/admin/player-notes";
import { InstallmentPlanDialog } from "@/components/admin/installment-plan-dialog";
import { requireRole } from "@/lib/auth";
import { StickyNote, CalendarRange } from "lucide-react";
import {
  formatARS,
  formatDate,
  formatDateLong,
  monthName,
  initials,
  ageFromBirth,
  fullName,
} from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole(["ADMIN", "PROFESOR"]);

  const [player, categories, auditLogs, notes, activePlans] = await Promise.all([
    prisma.player.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        additionalCategories: { orderBy: { year: "desc" }, select: { id: true, name: true } },
        payments: { orderBy: [{ year: "desc" }, { month: "desc" }] },
        attendances: { orderBy: { date: "desc" }, take: 60 },
        documents: { orderBy: { uploadedAt: "desc" } },
        parents: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.auditLog.findMany({
      where: { entityType: "Player", entityId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.playerNote
      .findMany({
        where: { playerId: params.id },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      })
      .catch(() => [] as Awaited<ReturnType<typeof prisma.playerNote.findMany>>),
    prisma.installmentPlan
      .findMany({
        where: { playerId: params.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => [] as Awaited<ReturnType<typeof prisma.installmentPlan.findMany>>),
  ]);

  if (!player) notFound();

  const userIds = Array.from(new Set([...auditLogs.map((l) => l.userId), ...notes.map((n) => n.authorId)]));
  const auditUsers = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } } })
    : [];
  const userMap = new Map(auditUsers.map((u) => [u.id, u]));
  const logsWithUser = auditLogs.map((l) => ({ ...l, user: userMap.get(l.userId) ?? null }));
  const notesWithAuthor = notes.map((n) => ({
    id: n.id,
    body: n.body,
    category: n.category,
    pinned: n.pinned,
    authorId: n.authorId,
    authorName: userMap.get(n.authorId)?.name,
    createdAt: n.createdAt,
  }));

  const presentCount = player.attendances.filter((a) => a.present).length;
  const attendancePct = player.attendances.length > 0
    ? Math.round((presentCount / player.attendances.length) * 100)
    : 0;

  const totalPaid = player.payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalDebt = player.payments
    .filter((p) => p.status === "OVERDUE")
    .reduce((s, p) => s + Number(p.amount), 0);

  const now = new Date();
  const fitnessExpired = player.fitnessExpiry && player.fitnessExpiry < now;
  const fitnessExpiryDaysAway = player.fitnessExpiry
    ? Math.floor((player.fitnessExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const fitnessSoon = fitnessExpiryDaysAway !== null && fitnessExpiryDaysAway >= 0 && fitnessExpiryDaysAway <= 30;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/admin/players"><ArrowLeft className="h-4 w-4" /> Volver al listado</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href={`/admin/players/${player.id}/editar`}>Editar perfil completo</Link>
        </Button>
      </div>

      {/* Hero */}
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-2 border-background ring-2 ring-zinc-200">
              <AvatarImage src={player.photo ?? undefined} />
              <AvatarFallback className="text-2xl">{initials(fullName(player.firstName, player.lastName))}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {player.lastName}, {player.firstName}
                </h1>
                <PlayerStatusBadge status={player.status} />
                {(fitnessExpired || fitnessSoon) && (
                  <Badge variant={fitnessExpired ? "danger" : "warning"}>
                    {fitnessExpired ? "Apto vencido" : "Apto por vencer"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {player.category.name}
                {player.additionalCategories.length > 0 && (
                  <> · <span className="text-amber-700 font-medium">también en {player.additionalCategories.map((c) => c.name).join(", ")}</span></>
                )}
                {player.dni ? ` · DNI ${player.dni}` : player.afaId ? ` · AFA ${player.afaId}` : ""} · {ageFromBirth(player.birthDate)} años
                {player.category.type === "PROFESIONAL" && (
                  <> · <span className="text-emerald-700 font-medium">sin cuota (Primera)</span></>
                )}
              </p>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-2 [&>*]:w-full sm:[&>*]:w-auto">
                <ChangeStatusButton playerId={player.id} currentStatus={player.status} />
                <ChangeCategoryButton
                  playerId={player.id}
                  currentCategoryId={player.categoryId}
                  categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                />
                <ApproveFitnessButton playerId={player.id} currentExpiry={player.fitnessExpiry} />
                <UpdateFeeButton playerId={player.id} currentFee={Number(player.monthlyFee)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat label="Cuota" value={formatARS(Number(player.monthlyFee))} icon={Wallet} />
            <Stat label="Cobrado" value={formatARS(totalPaid)} icon={TrendingUp} tone="success" />
            <Stat label="Deuda" value={formatARS(totalDebt)} icon={ShieldAlert} tone={totalDebt > 0 ? "danger" : "default"} />
            <Stat label="Asistencia" value={`${attendancePct}%`} icon={ClipboardCheck} tone={attendancePct >= 80 ? "success" : attendancePct >= 60 ? "warning" : "danger"} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="datos" className="w-full">
        <TabsList className="w-full md:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="medico">Médico</TabsTrigger>
          <TabsTrigger value="notas">
            Notas
            {notes.length > 0 && <span className="ml-1.5 text-[10px] px-1.5 rounded bg-amber-100 text-amber-800">{notes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="documentos">Documentación</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field icon={Calendar} label="Fecha de nacimiento" value={formatDateLong(player.birthDate)} />
                <Field icon={MapPin} label="Domicilio" value={player.address ?? "—"} />
                <Field icon={Phone} label="Contacto emergencia" value={player.emergencyContact ?? "—"} />
                <Field icon={GraduationCap} label="Colegio" value={player.schoolName ?? "—"} />
                <Field icon={UserCircle} label="Nacionalidad" value={player.nationality} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Padres / tutores</CardTitle>
                <CardDescription>{player.parents.length === 0 ? "Sin tutores vinculados" : `${player.parents.length} ${player.parents.length === 1 ? "tutor" : "tutores"}`}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {player.parents.length === 0 && (
                  <p className="text-muted-foreground text-xs">Asigná un tutor desde el módulo de Staff.</p>
                )}
                {player.parents.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-md hover:bg-muted">
                    <Avatar className="h-9 w-9"><AvatarFallback>{initials(p.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          {activePlans.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-blue-700" /> Plan de pagos activo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {activePlans.map((p) => (
                  <div key={p.id} className="text-sm flex items-center justify-between">
                    <span>{p.installments} cuotas de {formatARS(Number(p.totalAmount) / p.installments)}</span>
                    <span className="text-muted-foreground text-xs">Total {formatARS(Number(p.totalAmount))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Historial de pagos</CardTitle>
                <CardDescription>{player.payments.length} cuotas · {formatARS(totalPaid)} cobrado{totalDebt > 0 ? ` · ${formatARS(totalDebt)} de deuda` : ""}</CardDescription>
              </div>
              {user.role === "ADMIN" && totalDebt > 0 && (
                <InstallmentPlanDialog
                  playerId={player.id}
                  playerName={`${player.firstName} ${player.lastName}`}
                  payments={player.payments
                    .filter((p) => p.status === "OVERDUE" || p.status === "PENDING")
                    .map((p) => ({ id: p.id, amount: Number(p.amount), month: p.month, year: p.year }))}
                />
              )}
            </CardHeader>
            <CardContent className="p-0">
              {player.payments.length === 0 ? (
                <div className="p-6"><EmptyState icon={Wallet} title="Sin cuotas registradas" bare /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Pagado</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {player.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{monthName(p.month)} {p.year}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(p.dueDate)}</TableCell>
                        <TableCell className="text-sm">{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                        <TableCell className="text-sm">{p.paymentMethod ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatARS(Number(p.amount))}</TableCell>
                        <TableCell className="text-right"><PaymentStatusBadge status={p.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asistencia a entrenamientos</CardTitle>
              <CardDescription>
                {player.attendances.length > 0
                  ? `${attendancePct}% de presentes en los últimos ${player.attendances.length} entrenamientos`
                  : "Sin registros aún"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {player.attendances.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Sin asistencias cargadas"
                  description="La asistencia se toma desde el portal del profesor de la categoría."
                  bare
                />
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5">
                    {[...player.attendances].reverse().map((a) => (
                      <div
                        key={a.id}
                        title={`${formatDate(a.date)} · ${a.present ? "Presente" : "Ausente"}`}
                        className={`aspect-square rounded-sm transition-transform hover:scale-110 ${a.present ? "bg-emerald-500" : "bg-red-300"}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-emerald-500" /> Presente ({presentCount})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-red-300" /> Ausente ({player.attendances.length - presentCount})
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medico" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Cobertura médica</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field icon={Heart} label="Obra social" value={player.healthInsurance ?? "—"} />
                <Field icon={Heart} label="Nº de afiliado" value={player.healthInsuranceNumber ?? "—"} />
                {player.heightCm && (
                  <Field icon={Heart} label="Altura" value={`${player.heightCm} cm`} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Apto físico
                  {fitnessExpired && <Badge variant="danger">Vencido</Badge>}
                  {!fitnessExpired && fitnessSoon && <Badge variant="warning">Por vencer</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field
                  icon={Calendar}
                  label="Vencimiento"
                  value={player.fitnessExpiry ? formatDateLong(player.fitnessExpiry) : "Sin cargar"}
                  hint={
                    fitnessExpiryDaysAway !== null
                      ? fitnessExpiryDaysAway < 0
                        ? `Hace ${-fitnessExpiryDaysAway} días`
                        : fitnessExpiryDaysAway === 0
                          ? "Vence hoy"
                          : `En ${fitnessExpiryDaysAway} días`
                      : undefined
                  }
                />
                <Field icon={Heart} label="Registro AFA" value={player.afaRegistration ?? "—"} />
                <div className="pt-2">
                  <ApproveFitnessButton playerId={player.id} currentExpiry={player.fitnessExpiry} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notas">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Notas del staff
              </CardTitle>
              <CardDescription>
                Anotaciones internas sobre el jugador. Solo las ve el staff, no los padres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerNotes
                playerId={player.id}
                notes={notesWithAuthor}
                currentUserId={user.id}
                isAdmin={user.role === "ADMIN"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentación cargada</CardTitle>
              <CardDescription>{player.documents.length} archivos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {player.documents.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Sin documentación cargada"
                  description="Subí DNI, ficha médica, apto físico o cualquier otro documento desde el portal del padre."
                  bare
                />
              ) : (
                player.documents.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 grid place-items-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.type} · {formatDate(d.uploadedAt)}</p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={d.url} target="_blank" rel="noopener noreferrer">Ver</a>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" /> Historial del jugador
              </CardTitle>
              <CardDescription>
                Cada modificación en la ficha queda asentada con el usuario que la realizó y la fecha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditTimeline logs={logsWithUser} showUser />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "bg-zinc-50 text-zinc-700 border-zinc-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  } as const;
  return (
    <div className={`flex items-center gap-2 rounded-lg border p-3 ${toneClasses[tone]}`}>
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-sm font-semibold truncate tabular-nums">{value}</p>
      </div>
    </div>
  );
}
