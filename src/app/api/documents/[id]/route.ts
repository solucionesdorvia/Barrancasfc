import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * DELETE /api/documents/[id] — elimina un documento. Solo admin.
 * No borra el binary en otro lado porque guardamos data URIs en la
 * misma columna `url`, así que basta con borrar la fila.
 */
export const DELETE = withErrorHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");

  const doc = await prisma.document.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      type: true,
      player: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!doc) return apiNotFound("Documento no encontrado");

  await prisma.document.delete({ where: { id: doc.id } });

  await logAudit({
    userId: admin.id,
    entityType: "Document",
    entityId: doc.id,
    action: "DOCUMENT_UPLOADED",
    changes: {
      deleted: true,
      name: doc.name,
      type: doc.type,
      playerId: doc.player.id,
      playerName: `${doc.player.firstName} ${doc.player.lastName}`,
    },
  });

  return apiOk({ ok: true });
});
