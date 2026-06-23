import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkLoadFallback } from "@/components/clerk-load-fallback";

export default function Page() {
  return (
    <AuthShell
      mode="sign-in"
      footer={
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <Link href="/legal/terms" className="hover:text-zinc-800">Términos</Link>
          <span className="text-zinc-300">·</span>
          <Link href="/legal/privacy" className="hover:text-zinc-800">Privacidad</Link>
        </div>
      }
    >
      <SignIn
        fallbackRedirectUrl="/api/dispatch"
        appearance={{
          variables: { colorPrimary: "#0F766E" },
          // - headerSubtitle: ocultamos el "para continuar a <App name>",
          //   el branding ya está arriba.
          // - socialButtonsBlockButton: ocultamos "Continuar con Google"
          //   hasta configurar custom OAuth credentials en Google Cloud
          //   (las shared credentials de Clerk no funcionan en prod).
          // - dividerRow: el "o" entre social y email queda colgado sin
          //   sociales, lo ocultamos también.
          elements: {
            headerSubtitle: { display: "none" },
            socialButtonsBlockButton: { display: "none" },
            socialButtons: { display: "none" },
            dividerRow: { display: "none" },
          },
        }}
      />
      <ClerkLoadFallback />
    </AuthShell>
  );
}
