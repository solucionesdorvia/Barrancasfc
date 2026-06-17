"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, X } from "lucide-react";
import { UserButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand-logo";
import { ADMIN_NAV } from "@/components/admin/nav-items";

export function AdminMobileNav({
  clubName,
  logoUrl,
}: {
  clubName?: string | null;
  logoUrl?: string | null;
} = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Body scroll lock cuando está abierto
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur">
        <BrandLogo clubName={clubName} logoUrl={logoUrl} />
        <div className="flex items-center gap-1">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 animate-in fade-in-0 duration-200"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <aside
            className="absolute right-0 top-0 h-full w-72 bg-sidebar text-sidebar-foreground p-4 flex flex-col animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <BrandLogo textTone="light" size={32} clubName={clubName} logoUrl={logoUrl} />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="text-zinc-400 hover:text-white hover:bg-sidebar-accent">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                      active ? "bg-sidebar-accent text-white" : "text-zinc-400 hover:text-white hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <SignOutButton>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-zinc-400 hover:bg-sidebar-accent hover:text-white border-t border-sidebar-border pt-4 mt-2">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </SignOutButton>
          </aside>
        </div>
      )}
    </>
  );
}
