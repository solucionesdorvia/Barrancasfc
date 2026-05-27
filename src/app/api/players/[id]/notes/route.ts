import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { playerNoteCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

/**
 * Crear una nueva nota en la ficha del jugador.
 * Permitido para ADMIN y PROFESOR (los profesores podrán dejar observaciones
 * de los chicos que entrenan).
 */
export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole(["ADMIN", "PROFESOR"]);
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(playerNoteCreateSchema, { ...json, playerId: params.id });
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const note = await prisma.playerNote.create({
    data: {
      playerId: parsed.data.playerId,
      authorId: user.id,
      body: parsed.data.body,
      category: parsed.data.category,
      pinned: parsed.data.pinned ?? false,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: parsed.data.playerId,
    action: "NOTE_ADDED",
    changes: { noteId: note.id, category: parsed.data.category, pinned: note.pinned, preview: parsed.data.body.slice(0, 80) },
  });

  return apiOk(note);
});
