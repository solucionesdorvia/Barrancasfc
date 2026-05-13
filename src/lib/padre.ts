import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function getPadreContext(searchParam?: string) {
  const user = await requireRole("PADRE");
  const children = user.children;

  if (children.length === 0) {
    return { user, children: [], active: null };
  }

  const activeId = searchParam && children.some((c) => c.id === searchParam) ? searchParam : children[0].id;
  const active = await prisma.player.findUnique({
    where: { id: activeId },
    include: {
      category: true,
      payments: { orderBy: [{ year: "desc" }, { month: "desc" }] },
      attendances: { where: { date: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  return { user, children, active };
}
