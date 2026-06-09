import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { staffTaskCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

/**
 * POST /api/staff-tasks → admin crea una tarea para el staff.
 * Body: staffTaskCreateSchema
 */
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(staffTaskCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const task = await prisma.staffTask.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      priority: parsed.data.priority,
      assignedToId: parsed.data.assignedToId ?? null,
      assignedToRole: parsed.data.assignedToRole ?? null,
      relatedPlayerId: parsed.data.relatedPlayerId ?? null,
      createdById: user.id,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "StaffTask",
    entityId: task.id,
    action: "STAFF_TASK_CREATED",
    changes: {
      title: task.title,
      priority: task.priority,
      assignedToId: task.assignedToId,
      assignedToRole: task.assignedToRole,
    },
  });

  return apiOk(task);
});
