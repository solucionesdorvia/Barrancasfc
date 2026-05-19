import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Activity, AlertTriangle, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { KpiCard } from "@/components/admin/kpi-card";
import { formatARS, formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({ params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      players: {
        include: {
          payments: { orderBy: [{ year: "desc" }, { month: "desc" }] },
          attendances: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } },
        },
        orderBy: [{ status: "asc" }, { lastName: "asc" }],
      },
    },
  });

  if (!category) notFound();

  const players = category.players;
  const now = new Date();

  const active = players.filter((p) => p.status === "ACTIVE").length;
  const injured = players.filter((p) => p.status === "INJURED").length;
  const morosos = players.filter((p) => p.payments.some((q) => q.status === "OVERDUE")).length;
  const totalDebt = players.reduce(
    (s, p) => s + p.payments.filter((q) => q.status === "OVERDUE").reduce((a, q) => a + Number(q.amount), 0),
    0
  );
  const totalAtt = players.reduce((s, p) => s + p.attendances.length, 0);
  const presentAtt = players.reduce((s, p) => s + p.attendances.filter((a) => a.present).length, 0);
  const avgAtt = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/categories"><ArrowLeft className="h-4 w-4" /> Volver a categorías</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        <p className="text-sm text-muted-foreground">Plantel completo · {players.length} jugadores</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Plantel" value={String(players.length)} hint={`${active} activos · ${injured} lesionados`} icon={Users} />
        <KpiCard label="Asistencia 30d" value={`${avgAtt}%`} icon={Activity} tone={avgAtt >= 80 ? "success" : avgAtt >= 60 ? "warning" : "danger"} />
        <KpiCard label="Morosos" value={String(morosos)} icon={AlertTriangle} tone={morosos > 0 ? "danger" : "default"} />
        <KpiCard label="Deuda total" value={formatARS(totalDebt)} icon={Wallet} tone="warning" />
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead className="text-center">Edad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Apto físico</TableHead>
              <TableHead className="text-center">Asistencia</TableHead>
              <TableHead className="text-right">Cuota</TableHead>
              <TableHead className="text-right">Deuda</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p, i) => {
              const age = Math.floor((now.getTime() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
              const overdue = p.payments.filter((q) => q.status === "OVERDUE");
              const deuda = overdue.reduce((s, q) => s + Number(q.amount), 0);
              const pPresent = p.attendances.filter((a) => a.present).length;
              const pPct = p.attendances.length > 0 ? Math.round((pPresent / p.attendances.length) * 100) : null;
              const fitnessExpired = p.fitnessExpiry ? new Date(p.fitnessExpiry) < now : false;
              const fitnessSoon = p.fitnessExpiry && !fitnessExpired && new Date(p.fitnessExpiry).getTime() - now.getTime() < 30 * 24 * 3600 * 1000;

              return (
                <TableRow key={p.id}>
                  <TableCell className="text-center text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                  <TableCell>
                    <Link href={`/admin/players/${p.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.photo ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(`${p.firstName} ${p.lastName}`)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{p.lastName}, {p.firstName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.dni}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center text-sm">{age}</TableCell>
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
                      <span className={pPct >= 80 ? "text-emerald-600 font-semibold" : pPct >= 60 ? "text-amber-600 font-semibold" : "text-red-600 font-semibold"}>{pPct}%</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">s/d</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatARS(Number(p.monthlyFee))}</TableCell>
                  <TableCell className="text-right">
                    {deuda > 0 ? <span className="text-red-600 font-semibold">{formatARS(deuda)}</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/players/${p.id}`}>Ver ficha</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
