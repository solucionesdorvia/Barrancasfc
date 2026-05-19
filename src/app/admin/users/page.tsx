import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESOR: "Profesor",
  PADRE: "Padre",
};

export default async function UsersListPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PROFESOR"] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  // Stats: cuántos cambios hizo cada uno
  const counts = await prisma.auditLog.groupBy({
    by: ["userId"],
    _count: true,
    _max: { createdAt: true },
  });
  const countMap = new Map(counts.map((c) => [c.userId, c]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios del staff</h1>
        <p className="text-sm text-muted-foreground">Administradores y profesores · {users.length} usuarios</p>
      </div>
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Acciones registradas</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const stat = countMap.get(u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-center font-semibold">{stat?._count ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {stat?._max.createdAt ? formatDate(stat._max.createdAt) : "Sin actividad"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/users/${u.id}`}>Ver perfil</Link>
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
