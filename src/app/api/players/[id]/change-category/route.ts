import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { changeCategorySchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(changeCategorySchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const [player, newCat] = await Promise.all([
    prisma.player.findUnique({ where: { id: params.id }, include: { category: true } }),
    prisma.category.findUnique({ where: { id: parsed.data.categoryId } }),
  ]);
  if (!player) return apiNotFound("Jugador no encontrado");
  if (!newCat) return apiNotFound("Categoría no encontrada");
  if (player.clubId !== user.clubId || newCat.clubId !== user.clubId) return apiForbidden();
  if (player.categoryId === newCat.id) return apiOk({ ok: true, unchanged: true });

  const previousCategory = { id: player.categoryId, name: player.category.name };

  await prisma.player.update({
    where: { id: player.id },
    data: { categoryId: newCat.id },
  });

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: player.id,
    action: "PLAYER_CATEGORY_CHANGED",
    changes: {
      from: previousCategory,
      to: { id: newCat.id, name: newCat.name },
    },
  });

  return apiOk({ ok: true });
});
