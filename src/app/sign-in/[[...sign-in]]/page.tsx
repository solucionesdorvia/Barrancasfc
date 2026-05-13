import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 p-6">
      <SignIn appearance={{ variables: { colorPrimary: "#C8102E" } }} />
    </div>
  );
}
