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
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Plantel", icon: Shield },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/payments", label: "Cobranza", icon: Wallet },
  { href: "/admin/attendance", label: "Asistencia", icon: CalendarCheck },
  { href: "/admin/documents", label: "Documentación", icon: FileText },
  { href: "/admin/notices", label: "Avisos", icon: Bell },
  { href: "/admin/users", label: "Staff", icon: UserCog },
  { href: "/admin/audit", label: "Actividad", icon: Activity },
];
