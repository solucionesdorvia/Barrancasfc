import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { userCreateDirectSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiConflict, apiOk, apiServerError, withErrorHandler } from "@/lib/api";

/**
 * Crea una cuenta directo desde el admin (sin link de invitación).
 * El admin escribe email/password/nombre/rol y la persona puede entrar al toque.
 *
 * Flujo:
 * 1. Crea el usuario en Clerk (clerkClient.users.createUser)
 * 2. Crea el User en la DB con clerkId vinculado + role + categorías/hijos
 * 3. Si algo falla a mitad, rollback el de Clerk para no dejar huérfanos
 */
export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(userCreateDirectSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const { email, password, firstName, lastName, role, title, categoryIds, childrenIds } = parsed.data;

  // Validaciones cruzadas por rol
  if (role === "PROFESOR" && categoryIds.length === 0) {
    return apiBadRequest("Asigná al menos una categoría al profesor");
  }
  if (role === "PADRE" && childrenIds.length === 0) {
    return apiBadRequest("Asigná al menos un jugador al padre");
  }

  // Validar email único en DB
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiConflict("Ya existe un usuario con ese email en el sistema");
  }

  // 1. Crear en Clerk
  let clerkId: string;
  try {
    const clerkUser = await clerkClient().users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
      skipPasswordChecks: false,
      skipPasswordRequirement: false,
    });
    clerkId = clerkUser.id;
  } catch (e) {
    const msg = (e as { errors?: { message?: string }[] })?.errors?.[0]?.message;
    return apiBadRequest(msg ?? "No se pudo crear el usuario en Clerk. Revisá el email y password.");
  }

  // 2. Crear en DB
  try {
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: `${firstName} ${lastName}`.trim(),
        role,
        title: title || null,
        clubId: admin.clubId,
        assignedCategories: categoryIds.length ? { connect: categoryIds.map((id) => ({ id })) } : undefined,
        children: childrenIds.length ? { connect: childrenIds.map((id) => ({ id })) } : undefined,
      },
    });

    await logAudit({
      userId: admin.id,
      entityType: "User",
      entityId: user.id,
      action: "USER_CREATED_DIRECT",
      changes: { email, role, title, categoryIds, childrenIds, createdByAdmin: admin.name },
    });

    return apiOk({ id: user.id, email: user.email, role: user.role });
  } catch (e) {
    // Rollback: borrar el de Clerk si la DB falló
    try {
      await clerkClient().users.deleteUser(clerkId);
    } catch {
      // best effort, ya lo logueamos abajo
    }
    console.error("[users/create] DB failed, rolled back Clerk:", e);
    return apiServerError("No se pudo guardar el usuario. Intentá de nuevo.");
  }
});
