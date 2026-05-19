import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Heart, Calendar, GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { ChangeCategoryButton } from "@/components/admin/change-category-button";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { formatARS, formatDate, monthName, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const [player, categories, auditLogs] = await Promise.all([
    prisma.player.findUnique({
      where: { id: params.id },
      include: {
        category: true,
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
  ]);

  if (!player) notFound();

  const userIds = Array.from(new Set(auditLogs.map((l) => l.userId)));
  const auditUsers = await prisma.user.findMany({ where: { id: { in: userIds } } });
  const userMap = new Map(auditUsers.map((u) => [u.id, u]));
  const logsWithUser = auditLogs.map((l) => ({ ...l, user: userMap.get(l.userId) ?? null }));

  const presentCount = player.attendances.filter((a) => a.present).length;
  const attendancePct = player.attendances.length > 0
    ? Math.round((presentCount / player.attendances.length) * 100)
    : 0;

  const totalPaid = player.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);
  const totalDebt = player.payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/players"><ArrowLeft className="h-4 w-4" /> Volver al listado</Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <Avatar className="h-20 w-20 md:h-24 md:w-24 border">
          <AvatarImage src={player.photo ?? undefined} />
          <AvatarFallback className="text-2xl">{initials(`${player.firstName} ${player.lastName}`)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {player.firstName} {player.lastName}
            </h1>
            <PlayerStatusBadge status={player.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {player.category.name} · DNI {player.dni} · {player.nationality}
          </p>
          <div className="mt-2">
            <ChangeCategoryButton
              playerId={player.id}
              currentCategoryId={player.categoryId}
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <div>
              <span className="text-muted-foreground">Cuota: </span>
              <span className="font-medium">{formatARS(Number(player.monthlyFee))}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cobrado: </span>
              <span className="font-medium text-emerald-700">{formatARS(totalPaid)}</span>
            </div>
            {totalDebt > 0 && (
              <div>
                <span className="text-muted-foreground">Deuda: </span>
                <span className="font-medium text-red-600">{formatARS(totalDebt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="datos" className="w-full">
        <TabsList className="w-full md:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="medico">Médico</TabsTrigger>
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
                <Field icon={Calendar} label="Fecha de nacimiento" value={formatDate(player.birthDate)} />
                <Field icon={MapPin} label="Domicilio" value={player.address ?? "—"} />
                <Field icon={Phone} label="Contacto emergencia" value={player.emergencyContact ?? "—"} />
                <Field icon={GraduationCap} label="Colegio" value={player.schoolName ?? "—"} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Padres / tutores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {player.parents.length === 0 && <p className="text-muted-foreground">Sin tutores asignados.</p>}
                {player.parents.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback>{initials(p.name)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pagos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de pagos</CardTitle>
              <CardDescription>{player.payments.length} cuotas registradas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
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
                  {player.payments.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin pagos.</TableCell></TableRow>
                  )}
                  {player.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{monthName(p.month)} {p.year}</TableCell>
                      <TableCell className="text-sm">{formatDate(p.dueDate)}</TableCell>
                      <TableCell className="text-sm">{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                      <TableCell className="text-sm">{p.paymentMethod ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{formatARS(Number(p.amount))}</TableCell>
                      <TableCell className="text-right"><PaymentStatusBadge status={p.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asistencia</CardTitle>
              <CardDescription>{attendancePct}% de presentes en los últimos {player.attendances.length} entrenamientos</CardDescription>
            </CardHeader>
            <CardContent>
              {player.attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sin registros de asistencia. La asistencia se toma desde el portal del profesor.
                </p>
              ) : (
                <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 gap-1.5">
                  {player.attendances.map((a) => (
                    <div
                      key={a.id}
                      title={`${formatDate(a.date)} - ${a.present ? "Presente" : "Ausente"}`}
                      className={`aspect-square rounded ${a.present ? "bg-emerald-500" : "bg-red-300"}`}
                    />
                  ))}
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Apto físico</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Field
                  icon={Calendar}
                  label="Vencimiento"
                  value={player.fitnessExpiry ? formatDate(player.fitnessExpiry) : "—"}
                />
                <Field icon={Heart} label="Registro AFA" value={player.afaRegistration ?? "—"} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentación</CardTitle>
              <CardDescription>{player.documents.length} archivos cargados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {player.documents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay documentos cargados todavía.
                </p>
              )}
              {player.documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.type} · {formatDate(d.uploadedAt)}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={d.url} target="_blank" rel="noopener noreferrer">Ver</a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial del jugador</CardTitle>
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

function Field({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
