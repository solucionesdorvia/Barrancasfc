"use client";
import { usePathname } from "next/navigation";
import { Home, Wallet, Calendar, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { PadreLink } from "@/components/padre/padre-link";

const items = [
  { href: "/padre", label: "Inicio", icon: Home, exact: true },
  { href: "/padre/pagos", label: "Pagos", icon: Wallet },
  { href: "/padre/calendario", label: "Agenda", icon: Calendar },
  { href: "/padre/avisos", label: "Avisos", icon: Bell },
];

export function PadreBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 border-t bg-background/95 backdrop-blur z-30 safe-area-inset-bottom"
      aria-label="Navegación principal"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <PadreLink
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:bg-muted",
                active ? "text-barrancas-red" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 inset-x-6 h-0.5 bg-barrancas-red rounded-full" />
              )}
              <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
              {it.label}
            </PadreLink>
          );
        })}
      </div>
    </nav>
  );
}
