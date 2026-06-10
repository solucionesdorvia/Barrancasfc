import { Card, CardContent } from "@/components/ui/card";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { PlayerProfileForm } from "@/components/player-profile-form";
import { getPadreContext } from "@/lib/padre";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PadrePerfilPage({ searchParams }: { searchParams: { hijo?: string } }) {
  const { children, active } = await getPadreContext(searchParams.hijo);
  if (!active) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No tenés hijos vinculados.
        </CardContent>
      </Card>
    );
  }

  // Necesitamos el player con todos los campos para pre-llenar el form
  const player = await prisma.player.findUnique({ where: { id: active.id } });
  if (!player) return null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Perfil de {player.firstName}</h1>
        <p className="text-xs text-muted-foreground">
          Completá los datos para que el club te pueda contactar y agilizar trámites.
        </p>
      </div>

      <ChildSwitcher
        items={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, photo: c.photo }))}
        activeId={active.id}
      />

      {/* key={player.id} fuerza remount cuando el padre cambia de hijo en el
          ChildSwitcher — si no, el useState interno mantiene los datos del
          hijo anterior y al guardar los pisa en el hijo actual. */}
      <PlayerProfileForm key={player.id} player={player} isAdmin={false} />
    </div>
  );
}
