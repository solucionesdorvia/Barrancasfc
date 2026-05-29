import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Devuelve los eventos visibles para un usuario según su rol y categorías
 * relevantes (hijos para el padre, asignadas para el profesor).
 *
 * Reglas:
 * - ADMIN: ve todo (cualquier audience)
 * - PROFESOR: eventos ALL + PROFESOR + CATEGORY donde la categoría esté en sus
 *   assignedCategoryIds. Si no tiene categorías asignadas, no ve eventos CATEGORY.
 * - PADRE: eventos ALL + PADRE + CATEGORY donde la categoría sea de uno de sus
 *   hijos. Si no tiene hijos, no ve CATEGORY.
 */
export async function getVisibleEvents(opts: {
  role: Role;
  childrenCategoryIds?: string[];
  assignedCategoryIds?: string[];
  from?: Date;
  to?: Date;
}) {
  const { role, childrenCategoryIds = [], assignedCategoryIds = [], from, to } = opts;

  const audienceOr: { audience: "ALL" | Role | "CATEGORY"; categoryId?: { in: string[] } | string }[] = [
    { audience: "ALL" },
    { audience: role },
  ];
  if (role === "PADRE" && childrenCategoryIds.length > 0) {
    audienceOr.push({ audience: "CATEGORY", categoryId: { in: childrenCategoryIds } });
  }
  if (role === "PROFESOR" && assignedCategoryIds.length > 0) {
    audienceOr.push({ audience: "CATEGORY", categoryId: { in: assignedCategoryIds } });
  }
  if (role === "ADMIN") {
    audienceOr.push({ audience: "CATEGORY" });
    audienceOr.push({ audience: "PROFESOR" });
    audienceOr.push({ audience: "PADRE" });
  }

  // Si la tabla Event todavía no existe en la DB (deploy nuevo sin migrar),
  // devolvemos array vacío para no romper las páginas que la consumen.
  return prisma.event
    .findMany({
      where: {
        AND: [
          { OR: audienceOr },
          from ? { date: { gte: from } } : {},
          to ? { date: { lte: to } } : {},
        ],
      },
      orderBy: { date: "asc" },
    })
    .catch(() => [] as Awaited<ReturnType<typeof prisma.event.findMany>>);
}

export function eventTypeMeta(type: string) {
  switch (type) {
    case "TRAINING":
      return { label: "Entrenamiento", tone: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "MATCH":
      return { label: "Partido", tone: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" };
    case "MEETING":
      return { label: "Reunión", tone: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" };
    case "NOTICE":
      return { label: "Aviso", tone: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    default:
      return { label: "Otro", tone: "bg-zinc-100 text-zinc-700 border-zinc-200", dot: "bg-zinc-400" };
  }
}
