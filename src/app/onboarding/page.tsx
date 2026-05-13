import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function OnboardingPage() {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 p-6">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <h1 className="text-2xl font-bold">Tu cuenta aún no está habilitada</h1>
          <p className="text-sm text-muted-foreground">
            Iniciaste sesión con <span className="font-mono">{email}</span> pero todavía no
            estás asignado a un rol del club.
          </p>
          <p className="text-sm text-muted-foreground">
            Pedile a Manuela (admin) que te dé de alta, o usá las credenciales demo.
          </p>
          <SignOutButton>
            <Button variant="outline">Cerrar sesión</Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </main>
  );
}
