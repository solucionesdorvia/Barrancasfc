import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { PlayersToolbar } from "@/components/admin/players-toolbar";
import { ExcelImporter } from "@/components/admin/excel-importer";
import { formatDate, initials } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PlayersListPage({
  searchParams,
}: {
  searchParams: { q?: string; categoryId?: string; status?: string; overdue?: string; scholarship?: string };
}) {
  const where: Prisma.PlayerWhereInput = {};
  if (searchParams.q) {
    where.OR = [
      { firstName: { contains: searchParams.q, mode: "insensitive" } },
      { lastName: { contains: searchParams.q, mode: "insensitive" } },
      { dni: { contains: searchParams.q } },
    ];
  }
  if (searchParams.categoryId && searchParams.categoryId !== "all") where.categoryId = searchParams.categoryId;
  if (searchParams.status && searchParams.status !== "all") where.status = searchParams.status as never;
  if (searchParams.scholarship === "yes") where.scholarshipType = { not: "NONE" };
  if (searchParams.scholarship === "no") where.scholarshipType = "NONE";
  if (searchParams.overdue === "yes") where.payments = { some: { status: "OVERDUE" } };
  if (searchParams.overdue === "no") where.payments = { none: { status: "OVERDUE" } };

  const [players, categories] = await Promise.all([
    prisma.player.findMany({
      where,
      include: {
        category: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      // ACTIVE primero (orden alfabético del enum los pone primero ya), después por apellido
      orderBy: [{ status: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jugadores</h1>
          <p className="text-sm text-muted-foreground">{players.length} resultados</p>
        </div>
        <div className="flex gap-2">
          <ExcelImporter />
          <Button className="gap-2" asChild>
            <Link href="/admin/players/new"><Plus className="h-4 w-4" /> Nuevo jugador</Link>
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <PlayersToolbar categories={categories} />
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Beca</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No hay jugadores que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
            {players.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/admin/players/${p.id}`} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={p.photo ?? undefined} />
                      <AvatarFallback>{initials(`${p.firstName} ${p.lastName}`)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium hover:underline">{p.lastName}, {p.firstName}</p>
                      <p className="text-xs text-muted-foreground">Nac. {formatDate(p.birthDate)}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-sm font-mono">{p.dni}</TableCell>
                <TableCell className="text-sm">{p.category.name}</TableCell>
                <TableCell><PlayerStatusBadge status={p.status} /></TableCell>
                <TableCell className="text-sm">
                  {p.scholarshipType === "NONE" || !p.scholarshipType ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="font-medium">{p.scholarshipPercent}%</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/players/${p.id}`}>Ver ficha</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
