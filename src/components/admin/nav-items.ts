import {
  LayoutDashboard,
  Users,
  Wallet,
  CalendarCheck,
  FileText,
  Bell,
  Shield,
  UserCog,
  Activity,
  Calendar,
  BarChart3,
  AlertTriangle,
  ListTodo,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Plantel", icon: Shield },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/payments", label: "Cobranza", icon: Wallet },
  { href: "/admin/attendance", label: "Asistencia", icon: CalendarCheck },
  { href: "/admin/calendario", label: "Calendario", icon: Calendar },
  { href: "/admin/tareas", label: "Tareas", icon: ListTodo },
  { href: "/admin/alertas", label: "Alertas", icon: AlertTriangle },
  { href: "/admin/documents", label: "Documentación", icon: FileText },
  { href: "/admin/notices", label: "Avisos", icon: Bell },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/users", label: "Staff", icon: UserCog },
  { href: "/admin/audit", label: "Actividad", icon: Activity },
];
