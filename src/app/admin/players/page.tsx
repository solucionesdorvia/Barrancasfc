import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { PlayersToolbar } from "@/components/admin/players-toolbar";
import { ExcelImporter } from "@/components/admin/excel-importer";
import { ageFromBirth, fullName, initials, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayersListPage({
  searchParams,
}: {
  searchParams: { q?: string; categoryId?: string; status?: string; overdue?: string; scholarship?: string; flags?: string };
}) {
  const where: Prisma.PlayerWhereInput = {};
  if (searchParams.q) {
    const q = searchParams.q.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { dni: { contains: q } },
    ];
  }
  if (searchParams.categoryId && searchParams.categoryId !== "all") where.categoryId = searchParams.categoryId;
  if (searchParams.status && searchParams.status !== "all") where.status = searchParams.status as never;
  if (searchParams.scholarship === "yes") where.scholarshipType = { not: "NONE" };
  if (searchParams.scholarship === "no") where.scholarshipType = "NONE";
  if (searchParams.overdue === "yes") where.payments = { some: { status: "OVERDUE" } };
  if (searchParams.overdue === "no") where.payments = { none: { status: "OVERDUE" } };

  // Filtros de alertas
  const now = new Date();
  if (searchParams.flags === "no_docs") where.documents = { none: {} };
  if (searchParams.flags === "fitness_expired") where.fitnessExpiry = { lt: now };
  if (searchParams.flags === "fitness_soon") {
    where.fitnessExpiry = { gte: now, lte: new Date(now.getTime() + 30 * 24 * 3600 * 1000) };
  }
  if (searchParams.flags === "no_photo") where.photo = null;

  const [players, categories] = await Promise.all([
    prisma.player.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        birthDate: true,
        photo: true,
        status: true,
        scholarshipType: true,
        scholarshipPercent: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { lastName: "asc" }],
      take: 300,
    }),
    prisma.category.findMany({
      orderBy: [{ type: "asc" }, { year: "desc" }],
      select: { id: true, name: true },
    }),
  ]);

  const hasFilters = !!(searchParams.q || searchParams.categoryId || searchParams.status || searchParams.overdue || searchParams.scholarship || searchParams.flags);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jugadores"
        description={`${players.length} ${pluralize(players.length, "resultado")}${hasFilters ? " con los filtros aplicados" : ""}`}
        action={
          <>
            <ExcelImporter />
            <Button className="gap-2" asChild>
              <Link href="/admin/players/new"><Plus className="h-4 w-4" /> Nuevo jugador</Link>
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <PlayersToolbar categories={categories} />
      </Card>

      {players.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={hasFilters ? "No hay jugadores con esos filtros" : "Sin jugadores cargados"}
            description={hasFilters ? "Probá quitar algún filtro o usar el buscador." : "Importá un Excel o creá uno desde \"Nuevo jugador\"."}
            bare
            className="py-12"
          />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Jugador</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-center">Edad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Beca</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell>
                    <Link href={`/admin/players/${p.id}`} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.photo ?? undefined} />
                        <AvatarFallback>{initials(fullName(p.firstName, p.lastName))}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium group-hover:underline truncate"
                          title={`${p.lastName}, ${p.firstName}`}
                        >
                          {p.lastName}, {p.firstName}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{p.dni}</TableCell>
                  <TableCell className="text-sm">{p.category.name}</TableCell>
                  <TableCell className="text-center text-sm tabular-nums">{ageFromBirth(p.birthDate)}</TableCell>
                  <TableCell><PlayerStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-sm">
                    {p.scholarshipType === "NONE" || !p.scholarshipType ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="secondary">{p.scholarshipPercent}%</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/players/${p.id}`}>Abrir →</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
