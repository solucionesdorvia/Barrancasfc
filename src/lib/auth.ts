import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Devuelve el User de la DB linkeado al Clerk user actual.
 *
 * - Busca primero por clerkId (fast path).
 * - Si no hay match (caso primer login con seed), busca por email y lo linkea.
 * - Cacheado a nivel request via React `cache` para evitar re-queries cuando
 *   la página + layout + middleware llaman al mismo tiempo.
 */
export const getDbUser = cache(async () => {
  const { userId } = auth();
  if (!userId) return null;

  // Fast path: ya linkeado
  const byClerkId = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { club: true, children: { include: { category: true } } },
  });
  if (byClerkId) return byClerkId;

  // Slow path: primer login → linkear por email
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const byEmail = await prisma.user.findUnique({
    where: { email },
    include: { club: true, children: { include: { category: true } } },
  });
  if (!byEmail) return null;

  // Linkear y devolver actualizado
  const linked = await prisma.user.update({
    where: { id: byEmail.id },
    data: { clerkId: userId },
    include: { club: true, children: { include: { category: true } } },
  });
  return linked;
});

export async function requireUser() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  const user = await getDbUser();
  if (!user) redirect("/onboarding");
  return user;
}

/**
 * Garantiza que el usuario logueado tenga uno de los roles permitidos.
 * Si no, lo manda a su home según rol (sin loop).
 */
export async function requireRole(role: Role | Role[]) {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  if (allowed.includes(user.role)) return user;

  const dest =
    user.role === "ADMIN" ? "/admin" :
    user.role === "PROFESOR" ? "/profesor" :
    user.role === "PADRE" ? "/padre" : "/";
  redirect(dest);
}
