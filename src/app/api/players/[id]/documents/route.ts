import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { documentUploadSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * POST /api/players/[id]/documents — subir un documento al jugador.
 *
 * Acepta dataURL (image/* o application/pdf) o URL http(s).
 * Solo admin por ahora — el flujo del padre subiendo desde su panel
 * se mantiene separado y ya funciona con FK al hijo.
 */
export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(documentUploadSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!player) return apiNotFound("Jugador no encontrado");

  const doc = await prisma.document.create({
    data: {
      playerId: player.id,
      name: parsed.data.name,
      type: parsed.data.type,
      url: parsed.data.dataUrl,
      uploadedBy: admin.name,
    },
  });

  await logAudit({
    userId: admin.id,
    entityType: "Document",
    entityId: doc.id,
    action: "DOCUMENT_UPLOADED",
    changes: {
      playerId: player.id,
      playerName: `${player.firstName} ${player.lastName}`,
      type: doc.type,
      name: doc.name,
      isDataUri: doc.url.startsWith("data:"),
    },
  });

  return apiOk({ ok: true, id: doc.id });
});
