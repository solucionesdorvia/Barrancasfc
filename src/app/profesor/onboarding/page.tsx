import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/profesor/onboarding-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/**
 * Onboarding obligatorio para el profe la primera vez.
 *
 * - Si el user ya completó perfil → redirige a /profesor.
 * - Si no, muestra el form. Al enviar se setea profileCompleted=true y
 *   /profesor/layout deja pasar.
 *
 * Si Clerk trajo un name en formato "Nombre Apellido", lo pre-cargamos
 * para ahorrarle tipear al profe.
 */
export default async function OnboardingPage() {
  const user = await requireUser();

  if (user.profileCompleted) {
    if (user.role === "PROFESOR") redirect("/profesor");
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "PADRE") redirect("/padre");
    redirect("/");
  }

  // Categorías asignadas (para mostrar copy de bienvenida personalizado)
  const assigned = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: { assignedCategories: { select: { name: true } } },
    })
    .catch(() => null);
  const categoryNames = assigned?.assignedCategories.map((c) => c.name) ?? [];

  // Pre-fill desde el name si Clerk lo trajo "Nombre Apellido"
  let firstFromName: string | undefined;
  let lastFromName: string | undefined;
  if (user.name && !user.firstName) {
    const parts = user.name.trim().split(/\s+/);
    firstFromName = parts[0];
    if (parts.length > 1) lastFromName = parts.slice(1).join(" ");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Image
          src="/logo.png"
          alt="Barrancas FC"
          width={64}
          height={64}
          className="opacity-90"
        />
      </div>
      <Card className="p-5 md:p-6 shadow-sm">
        <OnboardingForm
          initialFirstName={user.firstName ?? firstFromName}
          initialLastName={user.lastName ?? lastFromName}
          email={user.email}
          assignedCategoriesCount={categoryNames.length}
          assignedCategoryNames={categoryNames}
        />
      </Card>
    </div>
  );
}
