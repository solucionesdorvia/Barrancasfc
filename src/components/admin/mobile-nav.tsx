"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Users, Wallet, CalendarCheck, FileText, Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
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

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)}>
          <aside
            className="absolute right-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <BrandLogo className="text-white mb-6" />
            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm",
                      active ? "bg-sidebar-accent text-white" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
