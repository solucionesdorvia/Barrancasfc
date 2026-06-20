import Link from "next/link";
import {
  Building2,
  Users,
  UserCircle,
  Plus,
  ArrowRight,
  Wallet,
  Activity,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditTimeline } from "@/components/admin/audit-timeline";
import { formatARS, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuperDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    clubsCount,
    usersCount,
    playersCount,
    activePlayersCount,
    paidThisMonth,
    pendingPayments,
    recentClubs,
    recentActivity,
  ] = await Promise.all([
    prisma.club.count(),
    prisma.user.count(),
    prisma.player.count(),
    prisma.player.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.count({ where: { status: "PENDING", dueDate: { lt: now } } }),
    prisma.club.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { users: true, players: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  // AuditLog guarda userId pero no tiene relación directa al User — lo
  // resolvemos en una query aparte y mergeamos.
  const userIds = Array.from(new Set(recentActivity.map((l) => l.userId)));
  const auditUsers = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true },
      })
    : [];
  const userById = new Map(auditUsers.map((u) => [u.id, u]));
  const activityWithUsers = recentActivity.map((log) => ({
    ...log,
    user: userById.get(log.userId) ?? null,
  }));

  const monthRevenue = Number(paidThisMonth._sum.amount ?? 0);
  const monthCount = paidThisMonth._count._all;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            Panel NEXCLUB · Vista global
          </p>
          <h1 className="font-serif text-4xl text-nex-ink leading-tight tracking-tight mt-1">
            Dashboard <span className="italic text-nex">en vivo</span>
          </h1>
        </div>
        <Button asChild className="bg-nex hover:bg-nex-hover text-white gap-2">
          <Link href="/super/clubs/new">
            <Plus className="h-4 w-4" /> Nuevo club
          </Link>
        </Button>
      </div>

      {/* Stats principales — fila grande */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigStat
          icon={Building2}
          label="Clubes"
          value={clubsCount}
          hint={clubsCount === 1 ? "Solo Barrancas activo" : `${clubsCount} en producción`}
          tone="nex"
        />
        <BigStat
          icon={Users}
          label="Jugadores"
          value={playersCount}
          hint={`${activePlayersCount} activos`}
          tone="ink"
        />
        <BigStat
          icon={UserCircle}
          label="Usuarios"
          value={usersCount}
          hint="admins, profes y padres"
          tone="ink"
        />
        <BigStat
          icon={Wallet}
          label="Cuotas vencidas"
          value={pendingPayments}
          hint={pendingPayments === 0 ? "Todo al día" : "pendientes de pago"}
          tone={pendingPayments === 0 ? "ok" : "warn"}
        />
      </div>

      {/* Ingresos del mes — destacado */}
      <Card className="bg-gradient-to-br from-nex-soft/40 via-white to-nex-bg border-nex-border">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
                <TrendingUp className="h-3.5 w-3.5" /> Ingresos del mes
              </div>
              <p className="mt-2 font-serif text-4xl sm:text-5xl text-nex-ink tabular-nums leading-none">
                {formatARS(monthRevenue)}
              </p>
              <p className="mt-2 text-sm text-nex-muted">
                {monthCount} {monthCount === 1 ? "cuota cobrada" : "cuotas cobradas"} en{" "}
                {now.toLocaleString("es-AR", { month: "long", year: "numeric" })}
              </p>
            </div>
            <Button asChild variant="ghost" className="gap-1.5 text-nex-ink hover:text-nex">
              <Link href="/admin/payments">
                Ver detalle <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid 2 col — clubes recientes + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Clubes recientes */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-nex" /> Clubes
              </h2>
              <Link
                href="/super/clubs"
                className="text-xs text-nex hover:underline inline-flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentClubs.length === 0 ? (
              <p className="text-sm text-nex-muted">Sin clubes todavía.</p>
            ) : (
              <ul className="divide-y divide-nex-border">
                {recentClubs.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/super/clubs/${c.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:bg-nex-soft/40 -mx-2 px-2 rounded-md transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate text-nex-ink">{c.name}</p>
                        <p className="text-xs text-nex-muted truncate">
                          {c.slug ?? "sin slug"} · {c._count.users}u · {c._count.players}j ·{" "}
                          {formatRelative(c.createdAt)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-nex-muted shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card className="lg:col-span-3">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-nex" /> Actividad reciente
              </h2>
              <span className="text-[10px] uppercase tracking-widest text-nex-muted">
                {recentActivity.length} eventos
              </span>
            </div>
            <AuditTimeline logs={activityWithUsers} showUser />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type Tone = "nex" | "ink" | "ok" | "warn";

function BigStat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "ink",
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  hint?: string;
  tone?: Tone;
}) {
  const tones: Record<Tone, { value: string; icon: string }> = {
    nex: { value: "text-nex", icon: "text-nex" },
    ink: { value: "text-nex-ink", icon: "text-nex-muted" },
    ok: { value: "text-emerald-600", icon: "text-emerald-600" },
    warn: { value: "text-amber-600", icon: "text-amber-600" },
  };
  const t = tones[tone];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-nex-muted font-semibold">
            {label}
          </p>
          <Icon className={`h-4 w-4 ${t.icon}`} />
        </div>
        <p className={`font-serif text-4xl tabular-nums leading-none ${t.value}`}>{value}</p>
        {hint && <p className="mt-2 text-xs text-nex-muted">{hint}</p>}
      </CardContent>
    </Card>
  );
}
