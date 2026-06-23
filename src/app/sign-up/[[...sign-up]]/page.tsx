import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkLoadFallback } from "@/components/clerk-load-fallback";

export default function Page() {
  return (
    <AuthShell
      subtitle="Creá tu cuenta"
      footer={
        <p className="text-[11px] text-zinc-500 text-center max-w-xs leading-relaxed">
          Al crear tu cuenta aceptás los{" "}
          <Link href="/legal/terms" className="underline underline-offset-2 hover:text-zinc-800">Términos</Link>{" "}
          y la{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-zinc-800">Política de Privacidad</Link>{" "}
          de NEXCLUB.
        </p>
      }
    >
      <SignUp fallbackRedirectUrl="/api/dispatch" appearance={{ variables: { colorPrimary: "#0F766E" } }} />
      <ClerkLoadFallback />
    </AuthShell>
  );
}
