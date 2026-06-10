import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { profesorOnboardingSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

/**
 * POST /api/profesor/onboarding — completar perfil obligatorio del profe
 * la primera vez que entra al sistema.
 *
 * Cualquier usuario autenticado puede completar el suyo (no es solo profe,
 * por si en el futuro padres o admins también necesitan completar onboarding).
 */
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireUser();
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(profesorOnboardingSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      title: parsed.data.title,
      photo: parsed.data.photo?.trim() ? parsed.data.photo : null,
      name: fullName,
      profileCompleted: true,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "PROFILE_COMPLETED",
    changes: { name: fullName, title: parsed.data.title, hasPhoto: !!parsed.data.photo },
  });

  return apiOk({ ok: true, user: { id: updated.id, name: updated.name } });
});
