import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatARS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      players: {
        include: {
          payments: { where: { status: "OVERDUE" } },
          attendances: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } },
        },
      },
    },
    orderBy: [{ type: "asc" }, { year: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plantilla por categorías</h1>
        <p className="text-sm text-muted-foreground">
          Vista de gestión de planteles · {categories.length} categorías activas
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Jugadores</TableHead>
              <TableHead className="text-center">Activos</TableHead>
              <TableHead className="text-center">Lesionados</TableHead>
              <TableHead className="text-center">Asistencia</TableHead>
              <TableHead className="text-center">Morosos</TableHead>
              <TableHead className="text-right">Deuda total</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => {
              const active = c.players.filter((p) => p.status === "ACTIVE").length;
              const injured = c.players.filter((p) => p.status === "INJURED").length;
              const morosos = c.players.filter((p) => p.payments.length > 0).length;
              const deuda = c.players.reduce(
                (s, p) => s + p.payments.reduce((a, q) => a + Number(q.amount), 0),
                0
              );
              const totalAtt = c.players.reduce((s, p) => s + p.attendances.length, 0);
              const presentAtt = c.players.reduce((s, p) => s + p.attendances.filter((a) => a.present).length, 0);
              const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
              return (
                <TableRow key={c.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/categories/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.type === "INFANTIL" ? "Infantil" : "Juvenil"}</div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{c.players.length}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="success">{active}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {injured > 0 ? <Badge variant="warning">{injured}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {totalAtt > 0 ? (
                      <span className={attPct >= 80 ? "text-emerald-600 font-semibold" : attPct >= 60 ? "text-amber-600 font-semibold" : "text-red-600 font-semibold"}>{attPct}%</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">s/d</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {morosos > 0 ? <Badge variant="danger">{morosos}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {deuda > 0 ? <span className="text-red-600">{formatARS(deuda)}</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/categories/${c.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
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
