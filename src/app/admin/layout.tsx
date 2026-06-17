import { requireRole } from "@/lib/auth";
import { getCurrentClub } from "@/lib/club";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";
import { PoweredByNexClub } from "@/components/nex/powered-by";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  const club = await getCurrentClub();
  const clubName = club?.name ?? null;
  const logoUrl = club?.logo ?? null;

  return (
    <div className="min-h-dvh bg-zinc-50">
      <AdminSidebar userName={user.name} clubName={clubName} logoUrl={logoUrl} />
      <AdminMobileNav clubName={clubName} logoUrl={logoUrl} />
      <main className="md:pl-64">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
          {children}
        </div>
        <footer className="px-4 md:px-8 py-8 max-w-7xl mx-auto md:pl-72">
          <PoweredByNexClub align="left" />
        </footer>
      </main>
    </div>
  );
}
