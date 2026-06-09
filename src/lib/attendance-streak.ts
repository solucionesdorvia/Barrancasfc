/**
 * Calcula racha de ausencias consecutivas a partir del último registro hacia
 * atrás. Útil para detectar deserción / chicos que dejaron de venir sin avisar.
 *
 * Reglas:
 * - Solo cuenta ausencias dentro del rango definido (default últimos 60 días)
 * - Frena cuando encuentra el primer "presente" o no hay más registros
 *
 * Devuelve `{ streak, lastSeen }` donde lastSeen es el último día que estuvo.
 */
export function absenceStreak(
  attendances: { date: Date; present: boolean }[],
  opts: { sinceDays?: number } = {}
): { streak: number; lastSeen: Date | null } {
  const since = opts.sinceDays
    ? new Date(Date.now() - opts.sinceDays * 24 * 3600 * 1000)
    : null;

  // Orden descendente por fecha
  const sorted = [...attendances]
    .filter((a) => (since ? a.date >= since : true))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  let streak = 0;
  let lastSeen: Date | null = null;
  for (const a of sorted) {
    if (a.present) {
      lastSeen = a.date;
      break;
    }
    streak++;
  }

  return { streak, lastSeen };
}

/** Umbral para considerar ausencias "prolongadas" */
export const PROLONGED_ABSENCE_THRESHOLD = 3;

export function isProlongedAbsence(streak: number): boolean {
  return streak >= PROLONGED_ABSENCE_THRESHOLD;
}
