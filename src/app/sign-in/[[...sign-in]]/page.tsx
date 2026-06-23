import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";
import { ClerkLoadFallback } from "@/components/clerk-load-fallback";

export default function Page() {
  return (
    <AuthShell
      subtitle="Ingresá a tu cuenta"
      footer={
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <Link href="/legal/terms" className="hover:text-zinc-800">Términos</Link>
          <span className="text-zinc-300">·</span>
          <Link href="/legal/privacy" className="hover:text-zinc-800">Privacidad</Link>
        </div>
      }
    >
      <SignIn forceRedirectUrl="/" appearance={{ variables: { colorPrimary: "#0F766E" } }} />
      <ClerkLoadFallback />
    </AuthShell>
  );
}
