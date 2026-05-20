/**
 * Funciones de formateo centralizadas. Importar SIEMPRE desde acá,
 * no inline en componentes.
 */

const ARS_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const ARS_FORMATTER_DECIMAL = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

const DATE_MEDIUM = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });
const DATE_LONG = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" });
const DATE_SHORT = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
const DATETIME_MEDIUM = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" });
const TIME_SHORT = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function formatARS(value: number | string | null | undefined, opts?: { decimals?: boolean }): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return opts?.decimals ? ARS_FORMATTER_DECIMAL.format(n) : ARS_FORMATTER.format(n);
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return NUMBER_FORMATTER.format(n);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_MEDIUM.format(date);
}

export function formatDateLong(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_LONG.format(date);
}

export function formatDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_SHORT.format(date);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_MEDIUM.format(date);
}

export function formatTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return TIME_SHORT.format(date);
}

export function monthName(m: number, short = false): string {
  if (m < 1 || m > 12) return "";
  return short ? MONTHS_SHORT[m - 1] : MONTHS[m - 1];
}

export function monthYear(m: number, y: number, short = true): string {
  return `${monthName(m, short)} ${y}`;
}

export function formatRelative(d: Date | string | null | undefined, now = new Date()): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.round(diffMs / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) return "ahora";
  if (Math.abs(minutes) < 60) return minutes > 0 ? `hace ${minutes} min` : `en ${-minutes} min`;
  if (Math.abs(hours) < 24) return hours > 0 ? `hace ${hours} h` : `en ${-hours} h`;
  if (Math.abs(days) < 7) return days > 0 ? `hace ${days} d` : `en ${-days} d`;
  return formatDate(date);
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function fullName(firstName: string | null | undefined, lastName: string | null | undefined): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "—";
}

export function ageFromBirth(birthDate: Date | string): number {
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/**
 * Devuelve "5 min", "2 h", "3 d" para mostrar el tiempo
 * entre dueDate y hoy. Negativo si es futuro.
 */
export function daysOverdue(dueDate: Date | string, now = new Date()): number {
  return daysBetween(dueDate, now);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
