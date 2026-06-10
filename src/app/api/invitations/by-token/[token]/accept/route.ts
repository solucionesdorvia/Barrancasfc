import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { apiBadRequest, apiOk, apiUnauthorized, withErrorHandler } from "@/lib/api";
import { lookupInvitation, INVITATION_FAILURE_LABEL } from "@/lib/invitations";

/**
 * Aceptar una invitación. Se llama desde /invite/[token]/accept después del
 * signup en Clerk. Crea el User en la DB con role/title/categorías/hijos
 * pre-asignados, y marca la invitación como usada.
 *
 * Si el usuario de Clerk ya está vinculado a un User existente en la DB:
 * - Si es el mismo email que la invitación → solo agrega las
 *   categorías/hijos al user existente (USER_CATEGORIES_UPDATED)
 * - Si no → rechazamos para no romper la cuenta existente
 */
export const POST = withErrorHandler(async (_req: Request, { params }: { params: { token: string } }) => {
  const { userId: clerkId } = auth();
  if (!clerkId) return apiUnauthorized("Tenés que iniciar sesión");

  const result = await lookupInvitation(params.token);
  if (!result.ok) return apiBadRequest(INVITATION_FAILURE_LABEL[result.reason]);
  const inv = result.invitation;

  const clerkUser = await currentUser();
  const clerkEmail = clerkUser?.emailAddresses[0]?.emailAddress;
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkEmail || "Usuario";

  if (!clerkEmail) return apiBadRequest("No pudimos leer tu email de Clerk");

  // Caso A: el User ya existe en DB (mismo email o mismo clerkId) → updateamos
  const existing = await prisma.user.findFirst({
    where: { OR: [{ clerkId }, { email: clerkEmail }] },
  });

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        clerkId,
        // Si la invitación trae un rol "mayor", lo respetamos (PADRE → PROFESOR → ADMIN)
        // Por simplicidad acá NO cambiamos el rol existente automáticamente; solo
        // sumamos categorías/hijos a un user ya creado.
        title: existing.title ?? inv.title,
        assignedCategories: inv.categoryIds.length
          ? { connect: inv.categoryIds.map((id) => ({ id })) }
          : undefined,
        children: inv.childrenIds.length
          ? { connect: inv.childrenIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    await logAudit({
      userId: user.id,
      entityType: "User",
      entityId: user.id,
      action: "USER_CATEGORIES_UPDATED",
      changes: { addedCategories: inv.categoryIds, addedChildren: inv.childrenIds, viaInvitation: inv.id },
    });
  } else {
    // Caso B: crear User nuevo
    // Profes y padres arrancan con profileCompleted=false → onboarding obligatorio.
    // Admins no requieren onboarding por ahora.
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkEmail,
        name,
        role: inv.role,
        title: inv.title,
        clubId: inv.clubId,
        profileCompleted: inv.role === "ADMIN",
        assignedCategories: inv.categoryIds.length
          ? { connect: inv.categoryIds.map((id) => ({ id })) }
          : undefined,
        children: inv.childrenIds.length
          ? { connect: inv.childrenIds.map((id) => ({ id })) }
          : undefined,
      },
    });
  }

  // Marcar invitación como usada
  await prisma.invitation.update({
    where: { id: inv.id },
    data: { usedAt: new Date(), usedByUserId: user.id },
  });

  await logAudit({
    userId: user.id,
    entityType: "Invitation",
    entityId: inv.id,
    action: "INVITATION_ACCEPTED",
    changes: {
      newUserId: user.id,
      email: clerkEmail,
      role: user.role,
      categoryIds: inv.categoryIds,
      childrenIds: inv.childrenIds,
    },
  });

  return apiOk({ ok: true, role: user.role });
});
