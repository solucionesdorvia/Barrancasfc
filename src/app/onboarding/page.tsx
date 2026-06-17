import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function OnboardingPage() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-nex-ink via-zinc-900 to-nex-primary p-6">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <h1 className="text-2xl font-bold">Tu cuenta aún no está habilitada</h1>
          <p className="text-sm text-muted-foreground">
            Iniciaste sesión con <span className="font-mono">{email}</span> pero todavía no
            estás asignada/o a un rol del club.
          </p>
          <p className="text-sm text-muted-foreground">
            Pedile al admin del club que te dé de alta, o usá tu link de invitación.
          </p>
          <SignOutButton>
            <Button variant="outline">Cerrar sesión</Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </main>
  );
}
