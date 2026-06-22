import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { NexClubWordmark } from "@/components/nex/wordmark";
import { PoweredByNexClub } from "@/components/nex/powered-by";
import { ClerkLoadFallback } from "@/components/clerk-load-fallback";

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-nex-ink via-zinc-900 to-nex-primary p-6">
      <NexClubWordmark size="lg" />
      <div className="relative">
        <SignIn
          forceRedirectUrl="/"
          appearance={{ variables: { colorPrimary: "#0F766E" } }}
        />
        <ClerkLoadFallback />
      </div>
      <div className="flex items-center gap-4 text-[11px] text-white/50">
        <Link href="/legal/terms" className="hover:text-white">Términos</Link>
        <span className="text-white/30">·</span>
        <Link href="/legal/privacy" className="hover:text-white">Privacidad</Link>
      </div>
      <PoweredByNexClub className="text-nex-soft/70 hover:text-white" />
    </div>
  );
}
