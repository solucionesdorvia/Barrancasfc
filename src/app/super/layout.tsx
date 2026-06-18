import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { LayoutDashboard, Building2, LogOut } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NexClubWordmark } from "@/components/nex/wordmark";

/**
 * Panel SUPERADMIN — accesible desde cualquier host. La seguridad es por
 * role, no por host: requireRole("SUPERADMIN") rechaza a quien no lo tenga.
 * Layout monocromo NEXCLUB: nunca toma colores del tenant.
 */
export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  await requireRole("SUPERADMIN");

  return (
    <div className="min-h-dvh bg-nex-bg text-nex-ink flex flex-col">
      <header className="border-b border-nex-border bg-nex-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/super" className="flex items-center gap-2">
            <NexClubWordmark size="md" />
            <span className="text-[10px] uppercase tracking-widest text-nex-muted">Super</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="gap-2 text-nex-ink hover:text-nex">
              <Link href="/super"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-2 text-nex-ink hover:text-nex">
              <Link href="/super/clubs"><Building2 className="h-4 w-4" /> Clubes</Link>
            </Button>
            <SignOutButton>
              <Button variant="ghost" size="sm" className="gap-2 text-nex-muted">
                <LogOut className="h-4 w-4" /> Salir
              </Button>
            </SignOutButton>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
