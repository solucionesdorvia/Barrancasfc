import Link from "next/link";
import { Building2, Users, UserCircle, Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SuperDashboard() {
  const [clubsCount, usersCount, playersCount, recentClubs] = await Promise.all([
    prisma.club.count(),
    prisma.user.count(),
    prisma.player.count(),
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
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">Panel NEXCLUB</p>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Button asChild className="bg-nex hover:bg-nex-hover text-white gap-2">
          <Link href="/super/clubs/new"><Plus className="h-4 w-4" /> Nuevo club</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Clubes activos" value={clubsCount} />
        <StatCard icon={UserCircle} label="Usuarios totales" value={usersCount} />
        <StatCard icon={Users} label="Jugadores totales" value={playersCount} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Clubes recientes</h2>
            <Link href="/super/clubs" className="text-xs text-nex hover:underline inline-flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentClubs.length === 0 ? (
            <p className="text-sm text-nex-muted">Todavía no hay clubes cargados.</p>
          ) : (
            <ul className="divide-y divide-nex-border">
              {recentClubs.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/super/clubs/${c.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-nex-soft/40 -mx-2 px-2 rounded"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-nex-muted truncate">
                        {c.slug ?? "sin slug"} · {c._count.users} usuarios · {c._count.players} jugadores
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
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-nex-muted font-semibold">{label}</p>
          <Icon className="h-4 w-4 text-nex" />
        </div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
