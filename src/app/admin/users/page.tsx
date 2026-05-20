import Link from "next/link";
import { UserCog } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { initials, formatRelative, formatDate, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESOR: "Profesor",
  PADRE: "Padre",
};

export default async function UsersListPage() {
  const [users, counts] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "PROFESOR"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.auditLog.groupBy({
      by: ["userId"],
      _count: true,
      _max: { createdAt: true },
    }),
  ]);
  const countMap = new Map(counts.map((c) => [c.userId, c]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff del club"
        description={`${users.length} ${pluralize(users.length, "usuario")} con acceso al sistema`}
      />

      {users.length === 0 ? (
        <Card>
          <EmptyState icon={UserCog} title="Sin staff cargado" bare className="py-12" />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const stat = countMap.get(u.id);
                return (
                  <TableRow key={u.id} className="group">
                    <TableCell>
                      <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">Alta {formatDate(u.createdAt)}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-center font-semibold tabular-nums">{stat?._count ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {stat?._max.createdAt ? (
                        <span title={formatDate(stat._max.createdAt)}>{formatRelative(stat._max.createdAt)}</span>
                      ) : (
                        "Sin actividad"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/users/${u.id}`}>Ver perfil →</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
