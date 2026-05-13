import { requireRole } from "@/lib/auth";
import { ProfesorHeader } from "@/components/profesor/header";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PROFESOR");
  return (
    <div className="min-h-dvh bg-zinc-50">
      <ProfesorHeader userName={user.name} />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6">{children}</main>
    </div>
  );
}
