import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { staffTaskUpdateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * PATCH /api/staff-tasks/[id]
 * - Admin puede editar todo.
 * - Cualquier user logueado puede marcarla como DONE/IN_PROGRESS si está asignada
 *   a su id o a su rol.
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(staffTaskUpdateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const task = await prisma.staffTask.findUnique({ where: { id: params.id } });
  if (!task) return apiNotFound("Tarea no encontrada");

  const isAdmin = user.role === "ADMIN";
  const isAssignee = task.assignedToId === user.id || task.assignedToRole === user.role;

  if (!isAdmin && !isAssignee) return apiForbidden("No podés modificar esta tarea");

  // Si no es admin, solo puede cambiar status
  const data: Record<string, unknown> = {};
  if (parsed.data.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "DONE") {
      data.completedAt = new Date();
      data.completedById = user.id;
    } else {
      data.completedAt = null;
      data.completedById = null;
    }
  }
  if (isAdmin) {
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
    if (parsed.data.assignedToId !== undefined) data.assignedToId = parsed.data.assignedToId;
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }
  }

  const updated = await prisma.staffTask.update({ where: { id: task.id }, data });

  await logAudit({
    userId: user.id,
    entityType: "StaffTask",
    entityId: task.id,
    action: parsed.data.status === "DONE" ? "STAFF_TASK_COMPLETED" : "STAFF_TASK_UPDATED",
    changes: data,
  });

  return apiOk(updated);
});

/**
 * DELETE /api/staff-tasks/[id] — solo admin.
 */
export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  if (user.role !== "ADMIN") return apiForbidden("Solo el admin puede borrar tareas");

  const task = await prisma.staffTask.findUnique({ where: { id: params.id } });
  if (!task) return apiNotFound("Tarea no encontrada");

  await prisma.staffTask.delete({ where: { id: task.id } });

  await logAudit({
    userId: user.id,
    entityType: "StaffTask",
    entityId: task.id,
    action: "STAFF_TASK_UPDATED",
    changes: { deleted: true, title: task.title },
  });

  return apiOk({ ok: true });
});
