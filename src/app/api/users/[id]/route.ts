import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { userUpdateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * PATCH /api/users/[id] — editar staff (nombre, título, asignaciones).
 * Solo admin. No permite cambiar role ni email.
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, name: true, title: true },
  });
  if (!target) return apiNotFound("Usuario no encontrado");

  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(userUpdateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  // Construimos el update. Para categorías/hijos hacemos `set` (reemplaza),
  // no `connect` (sumaría) — el admin ve la lista completa en el editor.
  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.title !== undefined) data.title = parsed.data.title || null;
  if (parsed.data.categoryIds !== undefined) {
    data.assignedCategories = { set: parsed.data.categoryIds.map((id) => ({ id })) };
  }
  if (parsed.data.childrenIds !== undefined) {
    data.children = { set: parsed.data.childrenIds.map((id) => ({ id })) };
  }

  const updated = await prisma.user.update({ where: { id: target.id }, data });

  await logAudit({
    userId: admin.id,
    entityType: "User",
    entityId: target.id,
    action: "USER_UPDATED",
    changes: { fields: Object.keys(data), targetEmail: target.name },
  });

  return apiOk({ ok: true, user: { id: updated.id, name: updated.name } });
});

/**
 * DELETE /api/users/[id] — borrar staff.
 * Solo admin. No permite borrarse a sí mismo.
 * Si tiene relaciones (children, audit), Prisma rechaza por FK — devolvemos
 * mensaje claro al admin para que primero desvincule.
 */
export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  if (admin.id === params.id) return apiForbidden("No podés borrar tu propia cuenta");

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, clerkId: true, role: true },
  });
  if (!target) return apiNotFound("Usuario no encontrado");

  // Audit log antes de borrar — sino se rompe la FK si el log apunta al target
  await logAudit({
    userId: admin.id,
    entityType: "User",
    entityId: target.id,
    action: "USER_DELETED",
    changes: { email: target.email, name: target.name, role: target.role },
  });

  try {
    // Borrar de la DB. Las relaciones (assignedCategories, children) se
    // desvinculan por @relation onDelete behavior; auditLog queda huérfano
    // pero preservado (sólo el FK del userId).
    await prisma.user.delete({ where: { id: target.id } });
  } catch (e) {
    console.error("[users/delete] DB delete failed:", e);
    return apiBadRequest(
      "No se pudo borrar — el usuario tiene actividad asociada. Probá desvinculando categorías/hijos primero o pedile soporte."
    );
  }

  // Best-effort: borrar también de Clerk (si tiene clerkId). Si falla, no
  // bloquea — la cuenta DB ya está fuera.
  if (target.clerkId && !target.clerkId.startsWith("pending_")) {
    try {
      await clerkClient().users.deleteUser(target.clerkId);
    } catch (e) {
      console.warn("[users/delete] Clerk deleteUser failed (DB ya borrado):", e);
    }
  }

  return apiOk({ ok: true });
});
