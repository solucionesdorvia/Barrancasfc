import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clubUpdateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

/** PATCH /api/super/clubs/[id] — editar club. Solo SUPERADMIN. */
export const PATCH = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const admin = await requireRole("SUPERADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(clubUpdateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const club = await prisma.club.findUnique({ where: { id: params.id } });
  if (!club) return apiNotFound("Club no encontrado");

  const data: Record<string, unknown> = { ...parsed.data };
  for (const k of Object.keys(data)) {
    if (data[k] === "") data[k] = null;
  }

  const updated = await prisma.club.update({
    where: { id: club.id },
    data: data as never,
  });

  await logAudit({
    userId: admin.id,
    entityType: "Club",
    entityId: club.id,
    action: "CLUB_UPDATED",
    changes: { fields: Object.keys(data), slug: updated.slug },
  });

  return apiOk({ ok: true, id: updated.id, slug: updated.slug });
});
