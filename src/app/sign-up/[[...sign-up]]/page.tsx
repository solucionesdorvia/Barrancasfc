import { SignUp } from "@clerk/nextjs";
import { NexClubWordmark } from "@/components/nex/wordmark";
import { PoweredByNexClub } from "@/components/nex/powered-by";

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-nex-ink via-zinc-900 to-nex-primary p-6">
      <NexClubWordmark size="lg" />
      <SignUp
        forceRedirectUrl="/"
        appearance={{ variables: { colorPrimary: "#0F766E" } }}
      />
      <PoweredByNexClub className="text-nex-soft/70 hover:text-white" />
    </div>
  );
}
