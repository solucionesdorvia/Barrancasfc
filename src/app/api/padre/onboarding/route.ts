import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { padreOnboardingSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";

/**
 * POST /api/padre/onboarding — completar perfil del padre la primera vez.
 * Guarda nombre, apellido, teléfono, relación con el hijo y marca
 * profileCompleted=true para que el guard de /padre/* lo deje pasar.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireUser();
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(padreOnboardingSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      title: parsed.data.relation, // guardamos la relación en `title`
      name: fullName,
      profileCompleted: true,
    },
  });

  await logAudit({
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "PROFILE_COMPLETED",
    changes: { name: fullName, relation: parsed.data.relation, role: "PADRE" },
  });

  return apiOk({ ok: true, user: { id: updated.id, name: updated.name } });
});
