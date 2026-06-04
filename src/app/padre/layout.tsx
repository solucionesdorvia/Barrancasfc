import { requireRole } from "@/lib/auth";
import { PadreHeader } from "@/components/padre/header";
import { PadreBottomNav } from "@/components/padre/bottom-nav";

export default async function PadreLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PADRE");
  return (
    <div className="min-h-dvh bg-zinc-50">
      <PadreHeader name={user.name} />
      <main className="max-w-md mx-auto px-4 py-4 pb-24 sm:pb-20">{children}</main>
      <PadreBottomNav />
    </div>
  );
}
