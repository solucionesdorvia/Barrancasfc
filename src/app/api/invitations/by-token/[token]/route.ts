import { prisma } from "@/lib/prisma";
import { apiNotFound, apiOk, withErrorHandler } from "@/lib/api";
import { lookupInvitation, INVITATION_FAILURE_LABEL } from "@/lib/invitations";

/**
 * Endpoint público — la landing /invite/[token] lo usa para mostrar el contexto
 * de la invitación antes del signup.
 */
export const GET = withErrorHandler(async (_req: Request, { params }: { params: { token: string } }) => {
  const result = await lookupInvitation(params.token);
  if (!result.ok) {
    return apiNotFound(INVITATION_FAILURE_LABEL[result.reason]);
  }
  const inv = result.invitation;

  // Resolver nombres legibles (categorías + hijos) para mostrar
  const [club, categories, children] = await Promise.all([
    prisma.club.findUnique({ where: { id: inv.clubId }, select: { name: true } }),
    inv.categoryIds.length
      ? prisma.category.findMany({ where: { id: { in: inv.categoryIds } }, select: { id: true, name: true } })
      : [],
    inv.childrenIds.length
      ? prisma.player.findMany({ where: { id: { in: inv.childrenIds } }, select: { id: true, firstName: true, lastName: true } })
      : [],
  ]);

  return apiOk({
    valid: true,
    role: inv.role,
    title: inv.title,
    email: inv.email,
    clubName: club?.name ?? "el club",
    expiresAt: inv.expiresAt,
    categories,
    children: children.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })),
  });
});
