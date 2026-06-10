import { z } from "zod";

/**
 * Schemas de validación para todas las API routes.
 * Cualquier endpoint que reciba body debe validar con uno de estos.
 */

export const cuidSchema = z.string().min(8).max(40);

export const markPaidSchema = z.object({
  method: z.enum(["Transferencia", "MercadoPago", "Efectivo", "Tarjeta", "Otro"]).default("Transferencia"),
  notes: z.string().max(500).optional(),
});

export const changeCategorySchema = z.object({
  categoryId: cuidSchema,
});

export const changePlayerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INJURED", "INACTIVE", "SUSPENDED"]),
  notes: z.string().max(500).optional(),
});

export const approveFitnessSchema = z.object({
  expiry: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().max(500).optional(),
});

export const updatePlayerFeeSchema = z.object({
  monthlyFee: z.number().min(0).max(10_000_000),
});

export const attendanceMarkSchema = z.object({
  date: z.string().datetime(),
  categoryId: cuidSchema.optional(),
  marks: z
    .array(
      z.object({
        playerId: cuidSchema,
        present: z.boolean(),
      })
    )
    .min(1)
    .max(200),
});

export const playerImportRowSchema = z.object({
  firstName: z.unknown(),
  lastName: z.unknown(),
  dni: z.unknown(),
  birthDate: z.unknown(),
  categoryName: z.unknown(),
  address: z.unknown().optional(),
  healthInsurance: z.unknown().optional(),
  healthInsuranceNumber: z.unknown().optional(),
  emergencyContact: z.unknown().optional(),
  schoolName: z.unknown().optional(),
});

export const playerImportSchema = z.object({
  rows: z.array(playerImportRowSchema).min(1).max(2000),
});

export const noticeCreateSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(3).max(2000),
  pollOptions: z.array(z.string().min(1).max(80)).max(6).optional().default([]),
  pollClosesAt: z.string().optional().nullable(),
});

export const noticeVoteSchema = z.object({
  noticeId: cuidSchema,
  optionIdx: z.number().int().min(0).max(5),
});

export const staffTaskCreateSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  assignedToId: cuidSchema.optional().nullable(),
  assignedToRole: z.enum(["ADMIN", "PROFESOR", "PADRE"]).optional().nullable(),
  relatedPlayerId: cuidSchema.optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const staffTaskUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  title: z.string().min(2).max(140).optional(),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedToId: cuidSchema.optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const familyGroupSchema = z.object({
  familyGroupId: z.string().min(3).max(60).optional().nullable(),
  familyDiscountPercent: z.number().int().min(0).max(100).optional().nullable(),
});

export const profesorOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresá tu nombre").max(60),
  lastName: z.string().trim().min(1, "Ingresá tu apellido").max(60),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido").max(30),
  title: z.enum(["DT", "Ayudante", "Preparador físico", "Coordinador", "Otro"]),
  photo: z.string().url().optional().or(z.literal("")),
});

export const padreOnboardingSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresá tu nombre").max(60),
  lastName: z.string().trim().min(1, "Ingresá tu apellido").max(60),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido").max(30),
  relation: z.enum(["Padre", "Madre", "Tutor/a", "Abuelo/a", "Otro"]),
});

export const playerNoteCreateSchema = z.object({
  playerId: cuidSchema,
  body: z.string().min(1).max(2000),
  category: z.enum(["medico", "academico", "disciplinario", "familiar", "general"]).default("general"),
  pinned: z.boolean().optional().default(false),
});

export const playerNoteUpdateSchema = z.object({
  body: z.string().min(1).max(2000).optional(),
  pinned: z.boolean().optional(),
  category: z.enum(["medico", "academico", "disciplinario", "familiar", "general"]).optional(),
});

export const installmentPlanCreateSchema = z.object({
  playerId: cuidSchema,
  paymentIds: z.array(cuidSchema).min(1).max(24),
  installments: z.number().int().min(2).max(12),
  notes: z.string().max(500).optional(),
});

export const eventCreateSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  date: z.string().min(1),
  endDate: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  type: z.enum(["TRAINING", "MATCH", "MEETING", "NOTICE", "OTHER"]).default("OTHER"),
  audience: z.enum(["ALL", "ADMIN", "PROFESOR", "PADRE", "CATEGORY"]).default("ALL"),
  categoryId: cuidSchema.optional().nullable(),
  // Recurrencia opcional. Si repeatType es "NONE" o undefined → evento único.
  // Si es "DAILY": se crea uno por día desde date hasta repeatUntil.
  // Si es "WEEKLY": se crea uno por cada daysOfWeek desde date hasta repeatUntil.
  repeatType: z.enum(["NONE", "DAILY", "WEEKLY"]).optional().default("NONE"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
  repeatUntil: z.string().optional().nullable(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

export const invitationCreateSchema = z.object({
  role: z.enum(["ADMIN", "PROFESOR", "PADRE"]),
  email: z.string().email().optional().or(z.literal("")),
  title: z.string().max(80).optional(),
  categoryIds: z.array(cuidSchema).max(20).optional().default([]),
  childrenIds: z.array(cuidSchema).max(20).optional().default([]),
  expiresInDays: z.number().int().min(1).max(90).optional().default(7),
});

export const playerProfileUpdateSchema = z.object({
  // Identificación
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  dni: z.string().regex(/^\d{7,9}$/, "DNI inválido").optional().nullable().or(z.literal("")),
  birthDate: z.string().optional().nullable(),
  nationality: z.string().max(40).optional().nullable(),
  citizenship: z.string().max(60).optional().nullable(),
  observations: z.string().max(2000).optional().nullable(),

  // Domicilio
  address: z.string().max(200).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  province: z.string().max(60).optional().nullable(),

  // Contacto personal
  personalPhone: z.string().max(30).optional().nullable(),
  personalEmail: z.string().email().optional().nullable().or(z.literal("")),
  notificationEmail: z.string().email().optional().nullable().or(z.literal("")),

  // Contacto de emergencia
  emergencyContactName: z.string().max(120).optional().nullable(),
  emergencyContactRelation: z.string().max(40).optional().nullable(),
  emergencyContactPhone: z.string().max(30).optional().nullable(),
  emergencyContactEmail: z.string().email().optional().nullable().or(z.literal("")),

  // Obra social
  hasHealthInsurance: z.boolean().optional(),
  healthInsurance: z.string().max(80).optional().nullable(),
  healthInsurancePlan: z.string().max(80).optional().nullable(),
  healthInsuranceNumber: z.string().max(40).optional().nullable(),

  // Educación
  schoolName: z.string().max(120).optional().nullable(),
  schoolStatus: z.enum(["PRIMARIA", "SECUNDARIA", "TERCIARIO", "UNIVERSITARIO", "FINALIZADO", "OTRO"]).optional().nullable(),
  schoolShift: z.enum(["MANANA", "TARDE", "NOCHE", "DOBLE"]).optional().nullable(),
  schoolStartTime: z.string().max(10).optional().nullable(),
  schoolEndTimeTuesday: z.string().max(10).optional().nullable(),
  schoolEndTimeWednesday: z.string().max(10).optional().nullable(),
  schoolEndTimeThursday: z.string().max(10).optional().nullable(),
  schoolEndTimeFriday: z.string().max(10).optional().nullable(),

  // Admin fields (solo admin)
  clothingPaid: z.boolean().optional(),
  transferStatus: z.enum(["SIN_PASE", "EN_TRAMITE", "CONFIRMADO"]).optional().nullable(),
  registeredIn2025: z.boolean().optional(),
  lastInstallmentNote: z.string().max(200).optional().nullable(),
  scholarshipType: z.enum(["NONE", "PARTIAL_25", "PARTIAL_50", "FULL"]).optional().nullable(),
  scholarshipPercent: z.number().int().min(0).max(100).optional().nullable(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  title: z.string().max(80).optional().nullable(),
  categoryIds: z.array(cuidSchema).max(20).optional(),
  childrenIds: z.array(cuidSchema).max(20).optional(),
});

export const userCreateDirectSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  role: z.enum(["ADMIN", "PROFESOR", "PADRE"]),
  title: z.string().max(80).optional(),
  categoryIds: z.array(cuidSchema).max(20).optional().default([]),
  childrenIds: z.array(cuidSchema).max(20).optional().default([]),
});

/**
 * Helper: aplica un schema y devuelve { ok, data, error } sin throw.
 * Útil para API routes que devuelven NextResponse.
 */
export function safeParse<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const msg = r.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
  return { ok: false, error: msg };
}
