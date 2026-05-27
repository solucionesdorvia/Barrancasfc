import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { playerNoteUpdateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * PATCH - togglear pin, editar categoría o body.
 * DELETE - eliminar nota (autor o admin).
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const note = await prisma.playerNote.findUnique({ where: { id: params.id } });
  if (!note) return apiNotFound("Nota no encontrada");
  if (note.authorId !== user.id && user.role !== "ADMIN") {
    return apiBadRequest("Solo el autor o un administrador pueden editar la nota");
  }

  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(playerNoteUpdateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const updated = await prisma.playerNote.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: note.playerId,
    action: "NOTE_UPDATED",
    changes: { noteId: note.id, changes: parsed.data },
  });

  return apiOk(updated);
});

export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const note = await prisma.playerNote.findUnique({ where: { id: params.id } });
  if (!note) return apiNotFound("Nota no encontrada");
  if (note.authorId !== user.id && user.role !== "ADMIN") {
    return apiBadRequest("Solo el autor o un administrador pueden eliminar la nota");
  }

  await prisma.playerNote.delete({ where: { id: params.id } });
  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: note.playerId,
    action: "NOTE_DELETED",
    changes: { noteId: note.id, preview: note.body.slice(0, 80) },
  });

  return apiOk({ ok: true });
});
