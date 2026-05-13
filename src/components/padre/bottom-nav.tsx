"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, FileText, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/padre", label: "Inicio", icon: Home },
  { href: "/padre/pagos", label: "Pagos", icon: Wallet },
  { href: "/padre/documentos", label: "Documentos", icon: FileText },
  { href: "/padre/avisos", label: "Avisos", icon: Bell },
];

export function PadreBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-background z-30">
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-xs",
                active ? "text-barrancas-red" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
