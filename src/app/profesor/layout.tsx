import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { ProfesorHeader } from "@/components/profesor/header";

export default async function ProfesorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("PROFESOR");

  // El onboarding usa este mismo árbol de layout (porque está bajo /profesor/),
  // pero queremos servirlo sin el header. Detectamos por pathname
  // (inyectado en x-pathname desde el middleware).
  const pathname = headers().get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/profesor/onboarding");

  if (!user.profileCompleted && !isOnboarding) {
    redirect("/profesor/onboarding");
  }

  if (isOnboarding) {
    // Pantalla limpia: el sublayout /profesor/onboarding/layout.tsx pone el bg.
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-zinc-50">
      <ProfesorHeader userName={user.name} />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6">{children}</main>
    </div>
  );
}
