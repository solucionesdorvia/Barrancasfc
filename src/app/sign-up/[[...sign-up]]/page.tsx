import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { NexClubWordmark } from "@/components/nex/wordmark";
import { PoweredByNexClub } from "@/components/nex/powered-by";
import { ClerkLoadFallback } from "@/components/clerk-load-fallback";

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-nex-ink via-zinc-900 to-nex-primary p-6">
      <NexClubWordmark size="lg" variant="light" />
      <div className="relative">
        <SignUp
          forceRedirectUrl="/"
          appearance={{ variables: { colorPrimary: "#0F766E" } }}
        />
        <ClerkLoadFallback />
      </div>
      <p className="text-[11px] text-white/60 text-center max-w-xs leading-relaxed">
        Al crear tu cuenta aceptás los{" "}
        <Link href="/legal/terms" className="underline underline-offset-2 hover:text-white">
          Términos
        </Link>{" "}
        y la{" "}
        <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-white">
          Política de Privacidad
        </Link>{" "}
        de NEXCLUB.
      </p>
      <PoweredByNexClub className="text-nex-soft/70 hover:text-white" />
    </div>
  );
}
