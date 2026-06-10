import { redirect } from "next/navigation";
import Image from "next/image";
import { Wallet, FileText, Bell, Calendar, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OnboardingForm } from "@/components/padre/onboarding-form";
import { initials, fullName as fullNameFmt } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Onboarding obligatorio del padre la primera vez.
 *
 * Muestra:
 * - Hero con escudo + bienvenida
 * - Lista de los hijos vinculados (con foto + categoría) para que el padre
 *   confirme que el club lo asoció correctamente
 * - Explicación corta de qué puede hacer en el portal
 * - Form de datos básicos (nombre, apellido, teléfono, relación)
 */
export default async function PadreOnboardingPage() {
  const user = await requireUser();

  if (user.profileCompleted) {
    if (user.role === "PADRE") redirect("/padre");
    if (user.role === "ADMIN") redirect("/admin");
    if (user.role === "PROFESOR") redirect("/profesor");
    redirect("/");
  }

  // Hijos vinculados (para confirmar el linkeo y personalizar la bienvenida)
  const data = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: {
        children: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photo: true,
            category: { select: { name: true } },
          },
        },
      },
    })
    .catch(() => null);
  const children = data?.children ?? [];

  // Pre-fill desde name si Clerk lo trajo
  let firstFromName: string | undefined;
  let lastFromName: string | undefined;
  if (user.name && !user.firstName) {
    const parts = user.name.trim().split(/\s+/);
    firstFromName = parts[0];
    if (parts.length > 1) lastFromName = parts.slice(1).join(" ");
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <Image src="/logo.png" alt="Barrancas FC" width={64} height={64} className="opacity-90" />
      </div>

      {/* Hijos vinculados */}
      {children.length > 0 && (
        <Card className="p-4 bg-white/80">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {children.length === 1 ? "Tu hijo/a en el club" : `Tus ${children.length} hijos en el club`}
          </p>
          <div className="space-y-2">
            {children.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.photo ?? undefined} />
                  <AvatarFallback className="text-xs">{initials(fullNameFmt(c.firstName, c.lastName))}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.category?.name ?? "Sin categoría"}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Qué pueden hacer */}
      <Card className="p-4 bg-white/80">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Lo que vas a poder hacer</p>
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5">
            <Wallet className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <span><span className="font-medium">Pagar cuotas y ver tu estado.</span> Mirá lo que pagaste y lo que está pendiente.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <FileText className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
            <span><span className="font-medium">Subir documentación.</span> DNI, ficha médica, apto físico — todo desde tu celular.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Bell className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
            <span><span className="font-medium">Recibir avisos del club.</span> Cambios de horario, partidos, encuestas — sin perder nada.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <span><span className="font-medium">Ver el calendario.</span> Entrenamientos, partidos y eventos del club siempre a mano.</span>
          </li>
        </ul>
      </Card>

      {/* Form */}
      <Card className="p-5 md:p-6 shadow-sm">
        <OnboardingForm
          initialFirstName={user.firstName ?? firstFromName}
          initialLastName={user.lastName ?? lastFromName}
          email={user.email}
          childrenCount={children.length}
        />
      </Card>
    </div>
  );
}
