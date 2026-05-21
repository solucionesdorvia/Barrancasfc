import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Activity, AlertTriangle, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { KpiCard } from "@/components/admin/kpi-card";
import { formatARS, formatDate, initials, fullName, ageFromBirth } from "@/lib/format";
import type { PlayerPosition } from "@prisma/client";

export const dynamic = "force-dynamic";

const POSITION_GROUPS: { key: PlayerPosition; label: string; short: string }[] = [
  { key: "GOALKEEPER", label: "Arqueros", short: "ARQ" },
  { key: "DEFENDER", label: "Defensores", short: "DEF" },
  { key: "MIDFIELDER", label: "Mediocampistas", short: "MED" },
  { key: "FORWARD", label: "Delanteros", short: "DEL" },
];

export default async function CategoryDetailPage({ params }: { params: { id: string } }) {
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, type: true, year: true },
  });
  if (!category) notFound();

  const players = await prisma.player.findMany({
    where: { categoryId: params.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dni: true,
      photo: true,
      birthDate: true,
      status: true,
      monthlyFee: true,
      fitnessExpiry: true,
      position: true,
      heightCm: true,
      nationality: true,
    },
    orderBy: [{ status: "asc" }, { lastName: "asc" }],
  });

  if (players.length === 0) {
    return (
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/admin/categories"><ArrowLeft className="h-4 w-4" /> Volver a categorías</Link>
        </Button>
        <PageHeader title={category.name} description="Plantel vacío" />
        <Card>
          <EmptyState
            icon={Users}
            title="Esta categoría no tiene jugadores"
            description="Importá un Excel o asigná jugadores existentes desde su ficha."
            bare
            className="py-12"
          />
        </Card>
      </div>
    );
  }

  const playerIds = players.map((p) => p.id);

  const [overduePayments, attendanceRows] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "OVERDUE", playerId: { in: playerIds } },
      select: { amount: true, playerId: true },
    }),
    prisma.attendance.findMany({
      where: { playerId: { in: playerIds }, date: { gte: since30d } },
      select: { playerId: true, present: true },
    }),
  ]);

  const debtByPlayer = new Map<string, number>();
  for (const p of overduePayments) {
    debtByPlayer.set(p.playerId, (debtByPlayer.get(p.playerId) ?? 0) + Number(p.amount));
  }
  const attByPlayer = new Map<string, { total: number; present: number }>();
  for (const a of attendanceRows) {
    const cur = attByPlayer.get(a.playerId) ?? { total: 0, present: 0 };
    cur.total++;
    if (a.present) cur.present++;
    attByPlayer.set(a.playerId, cur);
  }

  const active = players.filter((p) => p.status === "ACTIVE").length;
  const injured = players.filter((p) => p.status === "INJURED").length;
  const morosos = Array.from(debtByPlayer.values()).filter((v) => v > 0).length;
  const totalDebt = Array.from(debtByPlayer.values()).reduce((s, v) => s + v, 0);
  const totalAtt = attendanceRows.length;
  const presentAtt = attendanceRows.filter((a) => a.present).length;
  const avgAtt = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
  const now = new Date();

  const isProfessional = category.type === "PROFESIONAL";

  // Agrupar por posición si es profesional y todos tienen posición cargada
  const groups = isProfessional
    ? POSITION_GROUPS.map((g) => ({
        ...g,
        players: players.filter((p) => p.position === g.key),
      })).filter((g) => g.players.length > 0)
    : [{ key: null, label: "Plantel", short: "", players }];

  function renderPlayerRow(p: typeof players[number], i: number) {
    const age = ageFromBirth(p.birthDate);
    const debt = debtByPlayer.get(p.id) ?? 0;
    const att = attByPlayer.get(p.id);
    const pPct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
    const fitnessExpired = p.fitnessExpiry ? new Date(p.fitnessExpiry) < now : false;
    const fitnessSoon =
      p.fitnessExpiry && !fitnessExpired &&
      new Date(p.fitnessExpiry).getTime() - now.getTime() < 30 * 24 * 3600 * 1000;

    return (
      <TableRow key={p.id} className="group">
        <TableCell className="text-center text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
        <TableCell>
          <Link href={`/admin/players/${p.id}`} className="flex items-center gap-3 hover:underline">
            <Avatar className="h-8 w-8">
              <AvatarImage src={p.photo ?? undefined} />
              <AvatarFallback className="text-xs">{initials(fullName(p.firstName, p.lastName))}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.lastName}, {p.firstName}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {p.nationality === "Argentina" ? "🇦🇷" : "🌍"} {p.dni}
              </p>
            </div>
          </Link>
        </TableCell>
        <TableCell className="text-center text-sm tabular-nums">{age}</TableCell>
        <TableCell><PlayerStatusBadge status={p.status} /></TableCell>
        <TableCell>
          {!p.fitnessExpiry ? (
            <Badge variant="secondary">Sin cargar</Badge>
          ) : fitnessExpired ? (
            <Badge variant="danger">Vencido</Badge>
          ) : fitnessSoon ? (
            <Badge variant="warning">Por vencer</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">{formatDate(p.fitnessExpiry)}</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {pPct !== null ? (
            <span className={`tabular-nums font-semibold ${pPct >= 80 ? "text-emerald-600" : pPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
              {pPct}%
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">s/d</span>
          )}
        </TableCell>
        <TableCell className="text-right text-sm tabular-nums">
          {Number(p.monthlyFee) === 0 ? <span className="text-muted-foreground">—</span> : formatARS(Number(p.monthlyFee))}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {debt > 0 ? <span className="text-red-600 font-semibold">{formatARS(debt)}</span> : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-right">
          <Button asChild size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/admin/players/${p.id}`}>Abrir →</Link>
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/admin/categories"><ArrowLeft className="h-4 w-4" /> Volver a categorías</Link>
      </Button>

      <PageHeader
        title={category.name}
        description={`${isProfessional ? "Primer equipo" : "Plantel"} · ${players.length} jugadores`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Plantel" value={players.length} hint={`${active} activos · ${injured} lesionados`} icon={Users} />
        <KpiCard
          label="Asistencia 30d"
          value={totalAtt > 0 ? `${avgAtt}%` : "s/d"}
          icon={Activity}
          tone={totalAtt === 0 ? "default" : avgAtt >= 80 ? "success" : avgAtt >= 60 ? "warning" : "danger"}
        />
        <KpiCard label="Morosos" value={morosos} icon={AlertTriangle} tone={morosos > 0 ? "danger" : "default"} />
        <KpiCard label="Deuda total" value={formatARS(totalDebt)} icon={Wallet} tone={totalDebt > 0 ? "warning" : "default"} />
      </div>

      {groups.map((group) => (
        <Card key={group.label} className="p-0 overflow-hidden">
          {isProfessional && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.short}</span>
                <span className="font-semibold text-sm">{group.label}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{group.players.length} jugadores</span>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead className="text-center">Edad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Apto físico</TableHead>
                <TableHead className="text-center">Asistencia</TableHead>
                <TableHead className="text-right">Cuota</TableHead>
                <TableHead className="text-right">Deuda</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.players.map((p, i) => renderPlayerRow(p, i))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
