import { Activity, Wallet, FileText, ArrowRightLeft, ClipboardCheck, Upload, UserPlus, Pencil, ShieldCheck } from "lucide-react";
import type { AuditLog } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { AUDIT_ACTION_LABEL, type AuditAction } from "@/lib/audit";

const ICONS: Record<AuditAction, typeof Activity> = {
  PAYMENT_MARKED_PAID: Wallet,
  PAYMENT_REGISTERED: Wallet,
  PAYMENTS_GENERATED: Wallet,
  PLAYERS_IMPORTED: Upload,
  PLAYER_CREATED: UserPlus,
  PLAYER_UPDATED: Pencil,
  PLAYER_CATEGORY_CHANGED: ArrowRightLeft,
  PLAYER_STATUS_CHANGED: Pencil,
  ATTENDANCE_RECORDED: ClipboardCheck,
  DOCUMENT_UPLOADED: FileText,
  FITNESS_APPROVED: ShieldCheck,
};

type LogEntry = AuditLog & {
  user?: { id: string; name: string; role: string } | null;
};

export function AuditTimeline({ logs, showUser = false }: { logs: LogEntry[]; showUser?: boolean }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
        Sin movimientos registrados.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {logs.map((log) => {
        const Icon = ICONS[log.action as AuditAction] ?? Activity;
        const label = AUDIT_ACTION_LABEL[log.action as AuditAction] ?? log.action;
        const detail = formatChanges(log.action as AuditAction, log.changes);
        return (
          <li key={log.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-zinc-100 grid place-items-center text-zinc-600 group-hover:bg-barrancas-red group-hover:text-white transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 w-px bg-border my-1" />
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.createdAt)}</span>
              </div>
              {showUser && log.user && (
                <p className="text-xs mt-1">
                  por <span className="font-medium">{log.user.name}</span>
                  <span className="text-muted-foreground"> · {log.user.role.toLowerCase()}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function formatChanges(action: AuditAction, changes: unknown): string | null {
  if (!changes || typeof changes !== "object") return null;
  const c = changes as Record<string, unknown>;
  switch (action) {
    case "PAYMENT_MARKED_PAID":
      return `${monthYear(c)} · ${money(c.amount)} · ${c.method ?? ""}`;
    case "PAYMENTS_GENERATED":
      return `${c.count} cuotas para ${monthYearFromNumbers(c.month, c.year)}`;
    case "PLAYERS_IMPORTED":
      return `${c.inserted} jugadores agregados${c.errorCount ? ` · ${c.errorCount} errores` : ""}`;
    case "PLAYER_CATEGORY_CHANGED":
      return `de ${getName(c.from)} → a ${getName(c.to)}`;
    case "ATTENDANCE_RECORDED":
      return `${c.present}/${c.total} presentes${c.absent ? ` · ${c.absent} ausentes` : ""}`;
    case "DOCUMENT_UPLOADED":
      return String(c.name ?? c.type ?? "");
    default:
      return null;
  }
}

function monthYear(c: Record<string, unknown>) {
  return monthYearFromNumbers(c.month, c.year);
}
function monthYearFromNumbers(m: unknown, y: unknown) {
  const month = Number(m);
  const year = Number(y);
  if (!month || !year) return "";
  const names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${names[month - 1]} ${year}`;
}
function money(v: unknown) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(v ?? 0));
}
function getName(v: unknown) {
  if (v && typeof v === "object" && "name" in v) return String((v as { name: unknown }).name);
  return "—";
}
