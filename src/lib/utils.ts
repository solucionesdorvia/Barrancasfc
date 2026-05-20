import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge de clases Tailwind con dedup. Único helper de UI puro.
 * Para formato (fechas, moneda, etc) usar `@/lib/format`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-exports de format para mantener compat hacia atrás.
// Imports nuevos deberían apuntar directo a "@/lib/format".
export {
  formatARS,
  formatDate,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatTime,
  formatNumber,
  formatRelative,
  monthName,
  monthYear,
  daysBetween,
  daysOverdue,
  initials,
  fullName,
  ageFromBirth,
  pluralize,
} from "@/lib/format";
