import Link from "next/link";
import { UserCog, Send, Mail, CheckCircle2, Clock, XCircle, Ban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { InvitationDialog } from "@/components/admin/invitation-dialog";
import { InvitationActions } from "@/components/admin/invitation-actions";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { initials, formatRelative, formatDate, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  PROFESOR: "Profesor",
  PADRE: "Padre",
};

function invitationStatus(inv: { revoked: boolean; usedAt: Date | null; expiresAt: Date }) {
  if (inv.revoked) return { label: "Revocada", variant: "outline" as const, icon: Ban };
  if (inv.usedAt) return { label: "Aceptada", variant: "success" as const, icon: CheckCircle2 };
  if (inv.expiresAt < new Date()) return { label: "Expirada", variant: "outline" as const, icon: XCircle };
  return { label: "Pendiente", variant: "warning" as const, icon: Clock };
}

export default async function UsersListPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";

  const [users, counts, invitations, categories, players] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "PROFESOR"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        createdAt: true,
        assignedCategories: { select: { id: true, name: true } },
      },
    }),
    prisma.auditLog.groupBy({
      by: ["userId"],
      _count: true,
      _max: { createdAt: true },
    }),
    prisma.invitation
      .findMany({
        orderBy: [{ usedAt: "asc" }, { createdAt: "desc" }],
        take: 50,
      })
      .catch(() => [] as Awaited<ReturnType<typeof prisma.invitation.findMany>>),
    prisma.category.findMany({
      orderBy: [{ type: "asc" }, { year: "desc" }],
      select: { id: true, name: true },
    }),
    prisma.player
      .findMany({
        where: { status: { in: ["ACTIVE", "INJURED"] } },
        orderBy: { lastName: "asc" },
        select: { id: true, firstName: true, lastName: true, category: { select: { name: true } } },
        take: 500,
      })
      .catch(() => []),
  ]);
  const countMap = new Map(counts.map((c) => [c.userId, c]));

  const pendingCount = invitations.filter((i) => !i.revoked && !i.usedAt && i.expiresAt > new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff e invitaciones"
        description={`${users.length} ${pluralize(users.length, "usuario")} activos · ${pendingCount} ${pluralize(pendingCount, "invitación")} pendiente${pendingCount === 1 ? "" : "s"}`}
        action={
          <>
            <CreateUserDialog categories={categories} players={players} />
            <InvitationDialog categories={categories} players={players} />
          </>
        }
      />

      {/* Invitaciones */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Invitaciones</CardTitle>
          <CardDescription>
            Generá un link para que alguien cree su cuenta con un rol predefinido.
            El link sirve una sola vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {invitations.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Sin invitaciones todavía"
              description="Apretá 'Nueva invitación' arriba para crear la primera."
              bare
              className="py-10"
            />
          ) : (
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Referencia</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => {
                  const st = invitationStatus(inv);
                  const Icon = st.icon;
                  const ctx =
                    inv.role === "PROFESOR"
                      ? `${inv.categoryIds.length} categoría${inv.categoryIds.length === 1 ? "" : "s"}`
                      : inv.role === "PADRE"
                      ? `${inv.childrenIds.length} hijo${inv.childrenIds.length === 1 ? "" : "s"}`
                      : "—";
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{inv.email ?? <span className="text-muted-foreground italic">sin email</span>}</span>
                          {inv.title && <span className="text-[10px] text-muted-foreground">{inv.title}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.role === "ADMIN" ? "default" : "secondary"}>
                          {ROLE_LABEL[inv.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ctx}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="gap-1">
                          <Icon className="h-3 w-3" /> {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!inv.revoked && !inv.usedAt && inv.expiresAt > new Date() && (
                          <InvitationActions invitationId={inv.id} token={inv.token} baseUrl={baseUrl} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Staff activo */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b bg-muted/30">
          <CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Staff activo</CardTitle>
          <CardDescription>Admins y profesores con cuenta creada y acceso al sistema.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <EmptyState icon={UserCog} title="Sin staff cargado" bare className="py-12" />
          ) : (
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Categorías</TableHead>
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
                            <p className="text-xs text-muted-foreground">
                              {u.title ? `${u.title} · ` : ""}{u.email}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                          {ROLE_LABEL[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.assignedCategories.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.assignedCategories.slice(0, 3).map((c) => (
                              <Badge key={c.id} variant="outline" className="text-[10px]">{c.name}</Badge>
                            ))}
                            {u.assignedCategories.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">+{u.assignedCategories.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold tabular-nums">{stat?._count ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {stat?._max.createdAt ? (
                          <span title={formatDate(stat._max.createdAt)}>{formatRelative(stat._max.createdAt)}</span>
                        ) : (
                          "Sin actividad"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/users/${u.id}`}>Ver perfil →</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
