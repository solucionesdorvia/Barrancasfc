import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AttendanceOverviewPage() {
  const categories = await prisma.category.findMany({
    include: {
      players: {
        include: {
          attendances: {
            where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
          },
        },
      },
    },
    orderBy: [{ type: "asc" }, { year: "desc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
        <p className="text-sm text-muted-foreground">% promedio de los últimos 30 días por categoría</p>
      </div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Jugadores</TableHead>
              <TableHead className="text-center">Asistencias tomadas</TableHead>
              <TableHead>Asistencia</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => {
              const total = c.players.reduce((s, p) => s + p.attendances.length, 0);
              const present = c.players.reduce((s, p) => s + p.attendances.filter((a) => a.present).length, 0);
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/categories/${c.id}`} className="font-medium hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">{c.players.length}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{total}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={
                            pct >= 80 ? "h-full bg-emerald-500" : pct >= 60 ? "h-full bg-amber-500" : "h-full bg-red-500"
                          }
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold w-12 text-right ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {total > 0 ? `${pct}%` : "s/d"}
                      </span>
                    </div>
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
