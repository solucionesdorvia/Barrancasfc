import Link from "next/link";
import { CalendarDays, Bell, ChevronRight, Trophy, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { PayButton } from "@/components/padre/pay-button";
import { getPadreContext } from "@/lib/padre";
import { formatARS, formatDate, monthName, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PadreHomePage({ searchParams }: { searchParams: { hijo?: string } }) {
  const { user, children, active } = await getPadreContext(searchParams.hijo);

  if (!active) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">No tenés hijos vinculados a tu cuenta.</p>
        <p className="text-xs text-muted-foreground mt-2">Contactá a la administración del club.</p>
      </div>
    );
  }

  const nextDue = active.payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  const overdueDebt = active.payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + Number(p.amount), 0);
  const present = active.attendances.filter((a) => a.present).length;
  const total = active.attendances.length;
  const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" }, take: 2 });
  const pendingDocs = active.documents.length === 0;

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
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-barrancas-red to-red-700 text-white p-5">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-white">
              <AvatarImage src={active.photo ?? undefined} />
              <AvatarFallback className="text-white bg-white/20">{initials(`${active.firstName} ${active.lastName}`)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{active.firstName} {active.lastName}</p>
              <p className="text-xs opacity-90">{active.category.name} · {active.status === "ACTIVE" ? "Activo" : active.status === "INJURED" ? "Lesionado" : active.status}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs opacity-90"><Activity className="h-3 w-3" /> Asistencia</div>
              <p className="text-xl font-bold mt-0.5">{attendancePct}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs opacity-90"><Trophy className="h-3 w-3" /> Apto físico</div>
              <p className="text-xs font-semibold mt-0.5">
                {active.fitnessExpiry ? `Vence ${formatDate(active.fitnessExpiry)}` : "Sin registrar"}
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
              <p className="text-3xl font-bold">{formatARS(Number(nextDue.amount))}</p>
              <p className="text-xs text-muted-foreground">Vence {formatDate(nextDue.dueDate)}</p>
            </div>
            <PayButton
              paymentId={nextDue.id}
              amount={Number(nextDue.amount)}
              month={nextDue.month}
              year={nextDue.year}
              playerName={`${active.firstName} ${active.lastName}`}
            />
            {overdueDebt > 0 && (
              <p className="text-xs text-red-600 text-center">Deuda total acumulada: {formatARS(overdueDebt)}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-6">
            <Trophy className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
            <p className="font-medium text-sm">¡Todo al día!</p>
            <p className="text-xs text-muted-foreground">No tenés cuotas pendientes.</p>
          </CardContent>
        </Card>
      )}

      {/* Próximo entrenamiento */}
      <Card>
        <CardContent className="py-4 flex items-center gap-3">
          <div className="bg-zinc-100 rounded-md p-2.5">
            <CalendarDays className="h-5 w-5 text-zinc-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Próximo entrenamiento</p>
            <p className="text-xs text-muted-foreground">Lunes 18:00 hs · Cancha principal</p>
          </div>
        </CardContent>
      </Card>

      {/* Documentación pendiente */}
      {pendingDocs && (
        <Link href="/padre/documentos">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="bg-amber-100 rounded-md p-2">
                <Bell className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Documentación pendiente</p>
                <p className="text-xs text-amber-700">Falta cargar el apto físico de {active.firstName}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-700" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Avisos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Avisos del club</h2>
          <Link href="/padre/avisos" className="text-xs text-barrancas-red">Ver todos</Link>
        </div>
        <div className="space-y-2">
          {notices.map((n) => (
            <Card key={n.id}>
              <CardContent className="py-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
