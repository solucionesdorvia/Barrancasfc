import { requireRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/mobile-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");

  return (
    <div className="min-h-dvh bg-zinc-50">
      <AdminSidebar userName={user.name} />
      <AdminMobileNav />
      <main className="md:pl-64">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
