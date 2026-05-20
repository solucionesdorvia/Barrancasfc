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
