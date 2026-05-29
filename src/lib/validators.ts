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
