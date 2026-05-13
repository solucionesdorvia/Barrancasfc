import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Devuelve el User de la DB linkeado al Clerk user actual.
 * Si no existe en la DB pero sí en Clerk, lo crea con role PADRE por default.
 * Si no hay sesión, devuelve null.
 */
export async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  // Buscar por email (el seed los crea sin clerkId, los linkeamos al primer login)
  let user = await prisma.user.findFirst({
    where: { OR: [{ clerkId: clerkUser.id }, { email }] },
    include: { club: true, children: { include: { category: true } } },
  });

  if (user && !user.clerkId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { clerkId: clerkUser.id },
      include: { club: true, children: { include: { category: true } } },
    });
  }

  return user;
}

export async function requireUser() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  const user = await getDbUser();
  if (!user) redirect("/onboarding");
  return user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await requireUser();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) {
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "PROFESOR") redirect("/profesor");
    if (user.role === "PADRE") redirect("/padre");
    redirect("/");
  }
  return user;
}
