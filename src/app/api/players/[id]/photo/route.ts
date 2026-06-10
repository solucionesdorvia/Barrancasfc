import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/**
 * PATCH /api/players/[id]/photo — setear o limpiar la foto del jugador.
 * Solo admin. Acepta URL HTTP(S) o `null` para volver al avatar de iniciales.
 */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const json = (await req.json().catch(() => ({}))) as { photo?: string | null };
  const raw = typeof json.photo === "string" ? json.photo.trim() : null;

  if (raw && !/^https?:\/\//i.test(raw)) {
    return apiBadRequest("La URL tiene que empezar con http:// o https://");
  }
  if (raw && raw.length > 1000) {
    return apiBadRequest("La URL es demasiado larga");
  }

  const player = await prisma.player.findUnique({ where: { id: params.id }, select: { id: true, firstName: true, lastName: true } });
  if (!player) return apiNotFound("Jugador no encontrado");

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { photo: raw || null },
  });

  await logAudit({
    userId: admin.id,
    entityType: "Player",
    entityId: player.id,
    action: "PLAYER_UPDATED",
    changes: { field: "photo", set: !!raw },
  });

  return apiOk({ ok: true, photo: updated.photo });
});
