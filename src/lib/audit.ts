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
  | "PLAYER_FEE_UPDATED"
  | "ATTENDANCE_RECORDED"
  | "DOCUMENT_UPLOADED"
  | "FITNESS_APPROVED"
  | "NOTICE_CREATED"
  | "NOTE_ADDED"
  | "NOTE_UPDATED"
  | "NOTE_DELETED"
  | "INSTALLMENT_PLAN_CREATED"
  | "INSTALLMENT_PLAN_CANCELLED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_DELETED"
  | "INVITATION_CREATED"
  | "INVITATION_REVOKED"
  | "INVITATION_ACCEPTED"
  | "USER_CATEGORIES_UPDATED"
  | "USER_CREATED_DIRECT"
  | "POLL_VOTED"
  | "STAFF_TASK_CREATED"
  | "STAFF_TASK_UPDATED"
  | "STAFF_TASK_COMPLETED"
  | "FAMILY_GROUP_UPDATED";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  PAYMENT_MARKED_PAID: "Pago marcado como cobrado",
  PAYMENT_REGISTERED: "Pago registrado",
  PAYMENTS_GENERATED: "Cuotas mensuales generadas",
  PLAYERS_IMPORTED: "Jugadores importados desde Excel",
  PLAYER_CREATED: "Jugador creado",
  PLAYER_UPDATED: "Datos del jugador modificados",
  PLAYER_CATEGORY_CHANGED: "Categoría cambiada",
  PLAYER_STATUS_CHANGED: "Estado cambiado",
  PLAYER_FEE_UPDATED: "Cuota mensual actualizada",
  ATTENDANCE_RECORDED: "Asistencia registrada",
  DOCUMENT_UPLOADED: "Documento subido",
  FITNESS_APPROVED: "Apto físico cargado",
  NOTICE_CREATED: "Aviso publicado",
  NOTE_ADDED: "Nota agregada al jugador",
  NOTE_UPDATED: "Nota actualizada",
  NOTE_DELETED: "Nota eliminada",
  INSTALLMENT_PLAN_CREATED: "Plan de pagos creado",
  INSTALLMENT_PLAN_CANCELLED: "Plan de pagos cancelado",
  EVENT_CREATED: "Evento creado en el calendario",
  EVENT_UPDATED: "Evento actualizado",
  EVENT_DELETED: "Evento eliminado",
  INVITATION_CREATED: "Invitación generada",
  INVITATION_REVOKED: "Invitación revocada",
  INVITATION_ACCEPTED: "Invitación aceptada — usuario creado",
  USER_CATEGORIES_UPDATED: "Categorías asignadas actualizadas",
  USER_CREATED_DIRECT: "Cuenta creada directo desde admin",
  POLL_VOTED: "Voto registrado en encuesta",
  STAFF_TASK_CREATED: "Tarea creada",
  STAFF_TASK_UPDATED: "Tarea modificada",
  STAFF_TASK_COMPLETED: "Tarea completada",
  FAMILY_GROUP_UPDATED: "Grupo familiar actualizado",
};

export type AuditEntityType =
  | "Player"
  | "Payment"
  | "Attendance"
  | "Document"
  | "Category"
  | "System"
  | "Event"
  | "InstallmentPlan"
  | "Invitation"
  | "User"
  | "Notice"
  | "StaffTask";

export async function logAudit(input: {
  userId: string;
  entityType: AuditEntityType;
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
