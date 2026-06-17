import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { approveFitnessSchema, safeParse } from "@/lib/validators";
import { apiBadRequest, apiForbidden, apiNotFound, apiOk, withErrorHandler } from "@/lib/api";
import { assertPlayerInClub } from "@/lib/scope";

export const POST = withErrorHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireRole("ADMIN");
  const json = await req.json().catch(() => ({}));
  const parsed = safeParse(approveFitnessSchema, json);
  if (!parsed.ok) return apiBadRequest(parsed.error);

  const expiry = new Date(parsed.data.expiry);
  if (Number.isNaN(expiry.getTime())) return apiBadRequest("Fecha inválida");

  const scope = await assertPlayerInClub(params.id, user.clubId);
  if (!scope.ok) {
    return scope.reason === "not_found" ? apiNotFound("Jugador no encontrado") : apiForbidden();
  }

  const player = await prisma.player.findUnique({
    where: { id: params.id },
    select: { id: true, fitnessExpiry: true },
  });
  if (!player) return apiNotFound("Jugador no encontrado");

  const before = player.fitnessExpiry;
  await prisma.player.update({
    where: { id: player.id },
    data: { fitnessExpiry: expiry },
  });

  // Si vino el certificado, lo guardamos como Document type=MEDICAL.
  // Best-effort: si falla, igual el apto queda registrado (la fecha es lo
  // que más importa para la operación del club).
  let documentId: string | null = null;
  if (parsed.data.documentDataUrl) {
    try {
      const docName =
        parsed.data.documentName?.trim() ||
        `Apto físico — vence ${expiry.toISOString().slice(0, 10)}`;
      const doc = await prisma.document.create({
        data: {
          playerId: player.id,
          name: docName,
          type: "MEDICAL",
          url: parsed.data.documentDataUrl,
          uploadedBy: user.name,
        },
      });
      documentId = doc.id;
    } catch (e) {
      console.error("[approve-fitness] failed to attach document:", e);
    }
  }

  await logAudit({
    userId: user.id,
    entityType: "Player",
    entityId: player.id,
    action: "FITNESS_APPROVED",
    changes: {
      previousExpiry: before?.toISOString() ?? null,
      newExpiry: expiry.toISOString(),
      notes: parsed.data.notes,
      documentId,
    },
  });

  return apiOk({ ok: true, expiry: expiry.toISOString(), documentId });
});
