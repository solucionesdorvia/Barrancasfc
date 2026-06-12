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

  if (raw) {
    const isHttp = /^https?:\/\//i.test(raw);
    const isDataImage = /^data:image\/(jpeg|jpg|png|webp|heic|heif);base64,/i.test(raw);
    if (!isHttp && !isDataImage) {
      return apiBadRequest("Tiene que ser una URL http(s) o una imagen subida desde el dispositivo");
    }
    // Data URIs de imagen redimensionadas a 400px pesan ~30KB; ponemos un techo
    // generoso de 1MB en base64 (~750KB de imagen) para evitar inflar la columna.
    if (raw.length > 1_500_000) {
      return apiBadRequest("La imagen es demasiado grande. Probá con una más liviana.");
    }
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
