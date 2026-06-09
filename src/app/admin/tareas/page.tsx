import { ListTodo, Clock, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CreateTaskButton } from "@/components/admin/create-task-button";
import { StaffTaskRow } from "@/components/admin/staff-task-row";
import { pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

type StaffTask = Awaited<ReturnType<typeof prisma.staffTask.findMany>>[number];
type StaffMember = { id: string; name: string; role: string };
type PlayerLite = { id: string; firstName: string; lastName: string };

export default async function AdminTareasPage() {
  await requireRole("ADMIN");

  const [tasks, staff, players] = await Promise.all([
    prisma.staffTask
      .findMany({ orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }] })
      .catch(() => [] as StaffTask[]),
    prisma.user
      .findMany({
        where: { role: { in: ["ADMIN", "PROFESOR"] } },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" },
      })
      .catch(() => [] as StaffMember[]),
    prisma.player
      .findMany({ select: { id: true, firstName: true, lastName: true } })
      .catch(() => [] as PlayerLite[]),
  ]);

  const userMap = new Map<string, StaffMember>(staff.map((u) => [u.id, u]));
  const playerMap = new Map<string, PlayerLite>(players.map((p) => [p.id, p]));

  const enriched = tasks.map((t) => {
    const assignee = t.assignedToId ? userMap.get(t.assignedToId) : null;
    const player = t.relatedPlayerId ? playerMap.get(t.relatedPlayerId) : null;
    return {
      ...t,
      assigneeName: assignee?.name ?? null,
      playerName: player ? `${player.firstName} ${player.lastName}` : null,
    };
  });

  const pending = enriched.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS");
  const done = enriched.filter((t) => t.status === "DONE");
  const overdue = pending.filter((t) => t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tareas del staff"
        description={`${pending.length} ${pluralize(pending.length, "pendiente")}${overdue.length > 0 ? ` · ${overdue.length} vencidas` : ""}`}
        action={<CreateTaskButton staff={staff} />}
      />

      <Tabs defaultValue="pending">
        <TabsList className="w-full overflow-x-auto scrollbar-none">
          <TabsTrigger value="pending" className="shrink-0 whitespace-nowrap gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Pendientes
            {pending.length > 0 && <span className="ml-1 text-xs font-normal opacity-70">({pending.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="done" className="shrink-0 whitespace-nowrap gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completadas
            {done.length > 0 && <span className="ml-1 text-xs font-normal opacity-70">({done.length})</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-2">
          {pending.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No hay tareas pendientes"
              description="Cuando crees una, va a aparecer acá hasta que la marquen como completada."
            />
          ) : (
            pending.map((t) => <StaffTaskRow key={t.id} task={t} canEdit />)
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4 space-y-2">
          {done.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nada terminado todavía" description="Las tareas completadas van a quedar archivadas acá." />
          ) : (
            done.slice(0, 50).map((t) => <StaffTaskRow key={t.id} task={t} canEdit />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
