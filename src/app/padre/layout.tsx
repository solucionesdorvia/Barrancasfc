import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { getCurrentClub } from "@/lib/club";
import { PadreHeader } from "@/components/padre/header";
import { PadreBottomNav } from "@/components/padre/bottom-nav";
import { PoweredByNexClub } from "@/components/nex/powered-by";

export default async function PadreLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PADRE");
  const club = await getCurrentClub();

  // El onboarding usa este mismo árbol de layout (porque está bajo /padre/),
  // pero queremos servirlo sin el header ni el bottom nav. Detectamos por
  // pathname (inyectado en x-pathname desde el middleware).
  const pathname = headers().get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/padre/onboarding");

  if (!user.profileCompleted && !isOnboarding) {
    redirect("/padre/onboarding");
  }

  if (isOnboarding) {
    // Pantalla limpia: el sublayout /padre/onboarding/layout.tsx pone el bg.
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-zinc-50">
      <PadreHeader name={user.name} clubName={club?.name ?? null} logoUrl={club?.logo ?? null} />
      <main className="max-w-md mx-auto px-4 py-4 pb-24 sm:pb-20">
        {children}
        <div className="pt-6 pb-4">
          <PoweredByNexClub />
        </div>
      </main>
      <PadreBottomNav />
    </div>
  );
}
