import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "PAYMENT_MARKED_PAID"
  | "PAYMENT_REGISTERED"
  | "PAYMENTS_GENERATED"
  | "PLAYERS_IMPORTED"
  | "PLAYER_CREATED"
  | "PLAYER_UPDATED"
  | "PLAYER_CATEGORY_CHANGED"
  | "PLAYER_STATUS_CHANGED"
  | "ATTENDANCE_RECORDED"
  | "DOCUMENT_UPLOADED"
  | "FITNESS_APPROVED";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  PAYMENT_MARKED_PAID: "Pago marcado como cobrado",
  PAYMENT_REGISTERED: "Pago registrado",
  PAYMENTS_GENERATED: "Cuotas mensuales generadas",
  PLAYERS_IMPORTED: "Jugadores importados desde Excel",
  PLAYER_CREATED: "Jugador creado",
  PLAYER_UPDATED: "Datos de jugador modificados",
  PLAYER_CATEGORY_CHANGED: "Categoría cambiada",
  PLAYER_STATUS_CHANGED: "Estado cambiado",
  ATTENDANCE_RECORDED: "Asistencia registrada",
  DOCUMENT_UPLOADED: "Documento subido",
  FITNESS_APPROVED: "Apto físico aprobado",
};

export async function logAudit(input: {
  userId: string;
  entityType: "Player" | "Payment" | "Attendance" | "Document" | "Category" | "System";
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        changes: (input.changes ?? {}) as object,
      },
    });
  } catch (e) {
    console.error("[audit] failed to log:", e);
  }
}
