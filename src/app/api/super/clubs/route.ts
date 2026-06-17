import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { clubCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiConflict, apiOk, withErrorHandler } from "@/lib/api";

/**
 * POST /api/super/clubs — crear un club nuevo en NEXCLUB.
 * Solo SUPERADMIN. Después de crearlo, el dirigente del club puede entrar
 * en `<slug>.nexclub.app` (cuando el DNS esté apuntando) y arrancar con
 * una invitación admin generada desde el panel `/super`.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireRole("SUPERADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(clubCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  // El slug es único — validamos antes de crear para devolver 409 lindo
  const dup = await prisma.club.findUnique({ where: { slug: parsed.data.slug } });
  if (dup) return apiConflict(`Ya existe un club con slug "${parsed.data.slug}"`);

  // Strings vacíos → null
  const data: Record<string, unknown> = { ...parsed.data };
  for (const k of Object.keys(data)) {
    if (data[k] === "") data[k] = null;
  }

  const club = await prisma.club.create({ data: data as never });

  await logAudit({
    userId: admin.id,
    entityType: "Club",
    entityId: club.id,
    action: "CLUB_CREATED",
    changes: {
      slug: club.slug,
      name: club.name,
      createdBy: admin.name,
    },
  });

  return apiOk({ ok: true, id: club.id, slug: club.slug });
});
