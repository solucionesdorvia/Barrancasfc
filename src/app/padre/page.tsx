import Link from "next/link";
import { CalendarDays, Bell, ChevronRight, Trophy, Activity, ShieldAlert, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { PayButton } from "@/components/padre/pay-button";
import { getPadreContext } from "@/lib/padre";
import { formatARS, formatDate, monthName, initials, fullName } from "@/lib/format";

export const dynamic = "force-dynamic";

// Días de entrenamiento (lun/mié/vie). En sistema final esto viene de la categoría.
const TRAINING_DAYS = [1, 3, 5];
const TRAINING_HOUR = "18:00";

function nextTrainingDate(): { dayName: string; time: string; daysAway: number } {
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (TRAINING_DAYS.includes(d.getDay())) {
      const dayName = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][d.getDay()];
      const prefix = i === 0 ? "Hoy" : i === 1 ? "Mañana" : dayName;
      return { dayName: prefix, time: TRAINING_HOUR, daysAway: i };
    }
  }
  return { dayName: "Próximamente", time: TRAINING_HOUR, daysAway: -1 };
}

export default async function PadreHomePage({ searchParams }: { searchParams: { hijo?: string } }) {
  const { user, children, active } = await getPadreContext(searchParams.hijo);

  if (!active) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-sm text-muted-foreground">No tenés hijos vinculados a tu cuenta.</p>
          <p className="text-xs text-muted-foreground mt-2">Contactá a la administración del club.</p>
        </CardContent>
      </Card>
    );
  }

  const nextDue = active.payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  const overdueDebt = active.payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const present = active.attendances.filter((a) => a.present).length;
  const total = active.attendances.length;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : null;

  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" }, take: 2 });

  const now = new Date();
  const fitnessExpired = active.fitnessExpiry && active.fitnessExpiry < now;
  const fitnessSoon = active.fitnessExpiry && !fitnessExpired
    && active.fitnessExpiry.getTime() - now.getTime() < 30 * 24 * 3600 * 1000;
  const fitnessMissing = !active.fitnessExpiry;

  const training = nextTrainingDate();

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">Hola, {user.name.split(" ")[0]} 👋</h1>
      </div>

      <ChildSwitcher
        items={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, photo: c.photo }))}
        activeId={active.id}
      />

      {/* Hero del hijo */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-barrancas-red via-red-600 to-red-800 text-white p-5 relative">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative">
            <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
              <AvatarImage src={active.photo ?? undefined} />
              <AvatarFallback className="text-white bg-white/20">
                {initials(fullName(active.firstName, active.lastName))}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold leading-tight">{active.firstName} {active.lastName}</p>
              <p className="text-xs opacity-90">
                {active.category.name} ·{" "}
                {active.status === "ACTIVE" ? "Activo" : active.status === "INJURED" ? "Lesionado" : active.status}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 relative">
            <div className="bg-white/15 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs opacity-90">
                <Activity className="h-3 w-3" /> Asistencia
              </div>
              <p className="text-xl font-bold mt-0.5 tabular-nums">{attendancePct !== null ? `${attendancePct}%` : "s/d"}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs opacity-90">
                <Trophy className="h-3 w-3" /> Apto físico
              </div>
              <p className="text-xs font-semibold mt-0.5">
                {active.fitnessExpiry ? `Vence ${formatDate(active.fitnessExpiry)}` : "Sin cargar"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Próxima cuota */}
      {nextDue ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Próxima cuota
              {nextDue.status === "OVERDUE" && <Badge variant="danger">Atrasada</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">{monthName(nextDue.month)} {nextDue.year}</p>
              <p className="text-3xl font-bold tabular-nums">{formatARS(Number(nextDue.amount))}</p>
              <p className="text-xs text-muted-foreground">Vence {formatDate(nextDue.dueDate)}</p>
            </div>
            <PayButton
              paymentId={nextDue.id}
              amount={Number(nextDue.amount)}
              month={nextDue.month}
              year={nextDue.year}
              playerName={fullName(active.firstName, active.lastName)}
            />
            {overdueDebt > 0 && (
              <p className="text-xs text-red-600 text-center font-medium">
                Deuda acumulada total: {formatARS(overdueDebt)}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="text-center py-6">
            <Trophy className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
            <p className="font-medium text-sm text-emerald-900">¡Todo al día!</p>
            <p className="text-xs text-emerald-700 mt-0.5">No tenés cuotas pendientes.</p>
          </CardContent>
        </Card>
      )}

      {/* Próximo entrenamiento */}
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <div className="bg-blue-100 text-blue-700 rounded-md p-2.5">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Próximo entrenamiento</p>
            <p className="text-xs text-muted-foreground">{training.dayName} a las {training.time} hs · Cancha principal</p>
          </div>
        </CardContent>
      </Card>

      {/* Alertas de apto físico */}
      {(fitnessExpired || fitnessSoon || fitnessMissing) && (
        <Link href="/padre/documentos">
          <Card className="border-amber-200 bg-amber-50 transition-colors hover:bg-amber-100">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="bg-amber-100 text-amber-700 rounded-md p-2">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {fitnessExpired
                    ? "Apto físico vencido"
                    : fitnessSoon
                      ? "Apto físico por vencer"
                      : "Falta cargar el apto físico"}
                </p>
                <p className="text-xs text-amber-700">
                  Necesario para que {active.firstName} pueda seguir entrenando.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-700 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Documentación pendiente */}
      {active.documents.length === 0 && (
        <Link href="/padre/documentos">
          <Card className="border-zinc-200 transition-colors hover:bg-muted/50">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="bg-zinc-100 text-zinc-700 rounded-md p-2">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sin documentación cargada</p>
                <p className="text-xs text-muted-foreground">Subí DNI, partida y otros documentos.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Avisos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Avisos del club</h2>
          <Link href="/padre/avisos" className="text-xs text-barrancas-red font-medium">Ver todos</Link>
        </div>
        <div className="space-y-2">
          {notices.length === 0 ? (
            <Card>
              <CardContent className="py-4 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Sin avisos por ahora.</p>
              </CardContent>
            </Card>
          ) : (
            notices.map((n) => (
              <Card key={n.id} className="transition-shadow hover:shadow-md">
                <CardContent className="py-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{formatDate(n.createdAt)}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
