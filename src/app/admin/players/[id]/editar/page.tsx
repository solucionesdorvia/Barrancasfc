import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PlayerProfileForm } from "@/components/player-profile-form";

export const dynamic = "force-dynamic";

export default async function EditPlayerProfilePage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const player = await prisma.player.findUnique({ where: { id: params.id } });
  if (!player) notFound();

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href={`/admin/players/${player.id}`}><ArrowLeft className="h-4 w-4" /> Volver a la ficha</Link>
      </Button>
      <PageHeader
        title={`Editar perfil — ${player.lastName}, ${player.firstName}`}
        description="Datos personales, contacto, escolaridad y administrativo"
      />
      <PlayerProfileForm player={player} isAdmin />
    </div>
  );
}
