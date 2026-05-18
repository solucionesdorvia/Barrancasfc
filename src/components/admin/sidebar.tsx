"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Wallet, CalendarCheck, FileText, Bell, LogOut } from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/payments", label: "Cobranza", icon: Wallet },
  { href: "/admin/attendance", label: "Asistencia", icon: CalendarCheck },
  { href: "/admin/documents", label: "Documentación", icon: FileText },
  { href: "/admin/notices", label: "Avisos", icon: Bell },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:left-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <BrandLogo textTone="light" size={32} />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-zinc-400 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate">{userName}</span>
            <span className="text-xs text-zinc-500">Administrador</span>
          </div>
        </div>
        <SignOutButton>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-sidebar-accent hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
