import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { invitationCreateSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiOk, withErrorHandler } from "@/lib/api";
import { getBaseUrl } from "@/lib/base-url";

/**
 * Crear una nueva invitación. Genera un token random URL-safe y devuelve la
 * URL completa para que el admin la copie y la mande por afuera (WhatsApp/mail).
 */
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(invitationCreateSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const { role, email, title, categoryIds, childrenIds, expiresInDays } = parsed.data;

  // Validaciones cruzadas: el payload depende del rol
  if (role === "PROFESOR" && categoryIds.length === 0) {
    return apiBadRequest("Asigná al menos una categoría al profesor");
  }
  if (role === "PADRE" && childrenIds.length === 0) {
    return apiBadRequest("Asigná al menos un jugador al padre");
  }

  // Token URL-safe (sin /+=)
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 3600 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      token,
      email: email || null,
      role,
      title: title || null,
      clubId: user.clubId,
      categoryIds,
      childrenIds,
      createdById: user.id,
      expiresAt,
    },
  });

  const url = `${getBaseUrl()}/invite/${token}`;

  await logAudit({
    userId: user.id,
    entityType: "Invitation",
    entityId: invitation.id,
    action: "INVITATION_CREATED",
    changes: { role, email: email || null, categoryIds, childrenIds, expiresAt: expiresAt.toISOString() },
  });

  return apiOk({ id: invitation.id, token, url, expiresAt });
});
