import Link from "next/link";
import {
  Activity,
  Wallet,
  FileText,
  ArrowRightLeft,
  ClipboardCheck,
  Upload,
  UserPlus,
  Pencil,
  ShieldCheck,
  Bell,
  StickyNote,
  CalendarRange,
  CalendarPlus,
  CalendarX,
  CalendarCheck,
  Mail,
  MailX,
  MailCheck,
  BarChart3,
  ListTodo,
  CheckCircle2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AuditLog } from "@prisma/client";
import { formatDateTime, formatRelative, formatARS, monthName, initials } from "@/lib/format";
import { AUDIT_ACTION_LABEL, type AuditAction } from "@/lib/audit";
import { EmptyState } from "@/components/ui/empty-state";

const ICONS: Record<AuditAction, LucideIcon> = {
  PAYMENT_MARKED_PAID: Wallet,
  PAYMENT_REGISTERED: Wallet,
  PAYMENTS_GENERATED: Wallet,
  PLAYERS_IMPORTED: Upload,
  PLAYER_CREATED: UserPlus,
  PLAYER_UPDATED: Pencil,
  PLAYER_CATEGORY_CHANGED: ArrowRightLeft,
  PLAYER_STATUS_CHANGED: Pencil,
  PLAYER_FEE_UPDATED: Wallet,
  ATTENDANCE_RECORDED: ClipboardCheck,
  DOCUMENT_UPLOADED: FileText,
  FITNESS_APPROVED: ShieldCheck,
  NOTICE_CREATED: Bell,
  NOTE_ADDED: StickyNote,
  NOTE_UPDATED: StickyNote,
  NOTE_DELETED: StickyNote,
  INSTALLMENT_PLAN_CREATED: CalendarRange,
  INSTALLMENT_PLAN_CANCELLED: CalendarRange,
  EVENT_CREATED: CalendarPlus,
  EVENT_UPDATED: CalendarCheck,
  EVENT_DELETED: CalendarX,
  INVITATION_CREATED: Mail,
  INVITATION_REVOKED: MailX,
  INVITATION_ACCEPTED: MailCheck,
  USER_CATEGORIES_UPDATED: UserPlus,
  USER_CREATED_DIRECT: UserPlus,
  POLL_VOTED: BarChart3,
  STAFF_TASK_CREATED: ListTodo,
  STAFF_TASK_UPDATED: Pencil,
  STAFF_TASK_COMPLETED: CheckCircle2,
  FAMILY_GROUP_UPDATED: Users,
  PROFILE_COMPLETED: UserPlus,
};

const TONES: Record<AuditAction, string> = {
  PAYMENT_MARKED_PAID: "bg-emerald-100 text-emerald-700",
  PAYMENT_REGISTERED: "bg-emerald-100 text-emerald-700",
  PAYMENTS_GENERATED: "bg-blue-100 text-blue-700",
  PLAYERS_IMPORTED: "bg-violet-100 text-violet-700",
  PLAYER_CREATED: "bg-blue-100 text-blue-700",
  PLAYER_UPDATED: "bg-zinc-100 text-zinc-700",
  PLAYER_CATEGORY_CHANGED: "bg-amber-100 text-amber-700",
  PLAYER_STATUS_CHANGED: "bg-amber-100 text-amber-700",
  PLAYER_FEE_UPDATED: "bg-amber-100 text-amber-700",
  ATTENDANCE_RECORDED: "bg-cyan-100 text-cyan-700",
  DOCUMENT_UPLOADED: "bg-violet-100 text-violet-700",
  FITNESS_APPROVED: "bg-emerald-100 text-emerald-700",
  NOTICE_CREATED: "bg-rose-100 text-rose-700",
  NOTE_ADDED: "bg-amber-100 text-amber-700",
  NOTE_UPDATED: "bg-zinc-100 text-zinc-700",
  NOTE_DELETED: "bg-red-100 text-red-700",
  INSTALLMENT_PLAN_CREATED: "bg-blue-100 text-blue-700",
  INSTALLMENT_PLAN_CANCELLED: "bg-red-100 text-red-700",
  EVENT_CREATED: "bg-emerald-100 text-emerald-700",
  EVENT_UPDATED: "bg-zinc-100 text-zinc-700",
  EVENT_DELETED: "bg-red-100 text-red-700",
  INVITATION_CREATED: "bg-violet-100 text-violet-700",
  INVITATION_REVOKED: "bg-red-100 text-red-700",
  INVITATION_ACCEPTED: "bg-emerald-100 text-emerald-700",
  USER_CATEGORIES_UPDATED: "bg-blue-100 text-blue-700",
  USER_CREATED_DIRECT: "bg-emerald-100 text-emerald-700",
  POLL_VOTED: "bg-violet-100 text-violet-700",
  STAFF_TASK_CREATED: "bg-blue-100 text-blue-700",
  STAFF_TASK_UPDATED: "bg-zinc-100 text-zinc-700",
  STAFF_TASK_COMPLETED: "bg-emerald-100 text-emerald-700",
  FAMILY_GROUP_UPDATED: "bg-violet-100 text-violet-700",
  PROFILE_COMPLETED: "bg-emerald-100 text-emerald-700",
};

type LogEntry = AuditLog & {
  user?: { id: string; name: string; role: string } | null;
};

export function AuditTimeline({
  logs,
  showUser = false,
  showRelative = true,
}: {
  logs: LogEntry[];
  showUser?: boolean;
  showRelative?: boolean;
}) {
  if (logs.length === 0) {
    return <EmptyState icon={Activity} title="Sin movimientos registrados" description="Las acciones que se hagan en el sistema aparecerán acá." bare />;
  }

  return (
    <ol className="space-y-0">
      {logs.map((log, idx) => {
        const action = log.action as AuditAction;
        const Icon = ICONS[action] ?? Activity;
        const label = AUDIT_ACTION_LABEL[action] ?? log.action;
        const detail = formatChanges(action, log.changes);
        const tone = TONES[action] ?? "bg-zinc-100 text-zinc-700";
        const isLast = idx === logs.length - 1;
        return (
          <li key={log.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ring-2 ring-background ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && <div className="flex-1 w-px bg-border my-1 min-h-[16px]" />}
            </div>
            <div className="flex-1 pb-6 -mt-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  {detail && <p className="text-xs text-muted-foreground mt-1 break-words">{detail}</p>}
                </div>
                <span
                  title={formatDateTime(log.createdAt)}
                  className="text-xs text-muted-foreground whitespace-nowrap tabular-nums"
                >
                  {showRelative ? formatRelative(log.createdAt) : formatDateTime(log.createdAt)}
                </span>
              </div>
              {showUser && log.user && (
                <p className="text-xs mt-1.5 flex items-center gap-1.5 text-muted-foreground">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-medium text-zinc-700">
                    {initials(log.user.name)}
                  </span>
                  por{" "}
                  <Link href={`/admin/users/${log.user.id}`} className="font-medium text-foreground hover:underline">
                    {log.user.name}
                  </Link>
                  <span className="opacity-70">· {log.user.role.toLowerCase()}</span>
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
      return `${monthYear(c)} · ${formatARS(c.amount as number)}${c.method ? ` · ${c.method}` : ""}`;
    case "PAYMENTS_GENERATED":
      return `${c.count} cuotas para ${monthYearFromNumbers(c.month, c.year)}`;
    case "PLAYERS_IMPORTED":
      return `${c.inserted} jugadores agregados${c.errorCount ? ` · ${c.errorCount} errores` : ""}`;
    case "PLAYER_CATEGORY_CHANGED":
      return `de ${getName(c.from)} → ${getName(c.to)}`;
    case "PLAYER_STATUS_CHANGED":
      return `${translateStatus(c.from)} → ${translateStatus(c.to)}`;
    case "PLAYER_FEE_UPDATED":
      return `${formatARS(c.from as number)} → ${formatARS(c.to as number)}`;
    case "ATTENDANCE_RECORDED": {
      const date = c.date ? new Date(c.date as string) : null;
      const day = date ? `${date.getDate()}/${date.getMonth() + 1}` : "";
      return `${c.present}/${c.total} presentes${day ? ` · ${day}` : ""}`;
    }
    case "DOCUMENT_UPLOADED":
      return String(c.name ?? c.type ?? "");
    case "FITNESS_APPROVED":
      return c.newExpiry ? `Vence ${new Date(c.newExpiry as string).toLocaleDateString("es-AR")}` : null;
    case "NOTICE_CREATED":
      return String(c.title ?? "");
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
  return `${monthName(month, true)} ${year}`;
}
function getName(v: unknown) {
  if (v && typeof v === "object" && "name" in v) return String((v as { name: unknown }).name);
  return "—";
}
function translateStatus(v: unknown) {
  const map: Record<string, string> = {
    ACTIVE: "Activo",
    INJURED: "Lesionado",
    INACTIVE: "Inactivo",
    SUSPENDED: "Suspendido",
  };
  return map[String(v ?? "")] ?? String(v ?? "—");
}
