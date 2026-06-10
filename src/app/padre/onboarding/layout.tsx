/**
 * Layout aislado del onboarding del padre.
 * Pantalla limpia, sin el chrome del portal /padre.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-rose-50 to-zinc-50">
      <main className="max-w-md mx-auto px-4 py-8 md:py-12">{children}</main>
    </div>
  );
}
