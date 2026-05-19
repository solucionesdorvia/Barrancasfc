import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireRole("ADMIN");
  const body = await req.json().catch(() => ({}));
  const categoryId = body.categoryId;
  if (!categoryId) return NextResponse.json({ error: "categoryId requerido" }, { status: 400 });

  const [player, newCat] = await Promise.all([
    prisma.player.findUnique({ where: { id: params.id }, include: { category: true } }),
    prisma.category.findUnique({ where: { id: categoryId } }),
  ]);
  if (!player) return NextResponse.json({ error: "Jugador no encontrado" }, { status: 404 });
  if (!newCat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  if (player.categoryId === newCat.id) return NextResponse.json({ ok: true });

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
      from: { id: player.categoryId, name: player.category.name },
      to: { id: newCat.id, name: newCat.name },
    },
  });

  return NextResponse.json({ ok: true });
}
