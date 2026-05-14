import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 p-6">
      <Image src="/logo.png" alt="Barrancas FC" width={80} height={106} priority />
      <SignIn appearance={{ variables: { colorPrimary: "#C8102E" } }} />
    </div>
  );
}
