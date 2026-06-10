/**
 * Layout aislado del onboarding del profe.
 *
 * No usa el ProfesorLayout porque ese layout (1) llama a requireRole("PROFESOR")
 * pero también nosotros queremos chequearlo acá, y (2) muestra el ProfesorHeader
 * con el nombre del user, que en este punto puede no estar seteado. Mejor pantalla
 * limpia de bienvenida sin chrome.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-rose-50 to-zinc-50">
      <main className="max-w-md mx-auto px-4 py-10 md:py-16">{children}</main>
    </div>
  );
}
