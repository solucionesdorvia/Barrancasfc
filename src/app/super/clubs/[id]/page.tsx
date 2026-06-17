import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClubForm, OpenClubLink } from "@/components/super/club-form";

export const dynamic = "force-dynamic";

export default async function EditClubPage({ params }: { params: { id: string } }) {
  const club = await prisma.club.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      slug: true,
      name: true,
      logo: true,
      tagline: true,
      primary: true,
      primaryHover: true,
      primarySoft: true,
      onPrimary: true,
      accent: true,
      contactWhatsapp: true,
      contactEmail: true,
      _count: { select: { users: true, players: true, categories: true } },
    },
  });
  if (!club) notFound();

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nexclub.app";

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-nex-muted hover:text-nex-ink">
        <Link href="/super/clubs"><ArrowLeft className="h-4 w-4" /> Volver a clubes</Link>
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">Editar club</p>
          <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
          {club.slug && <OpenClubLink slug={club.slug} rootDomain={rootDomain} />}
        </div>
        <Card className="bg-nex-soft/40 border-nex-border shrink-0">
          <CardContent className="py-3 flex gap-5">
            <Stat label="Users" value={club._count.users} />
            <Stat label="Jugadores" value={club._count.players} />
            <Stat label="Categorías" value={club._count.categories} />
          </CardContent>
        </Card>
      </div>

      <ClubForm
        clubId={club.id}
        initial={{
          slug: club.slug ?? "",
          name: club.name,
          logo: club.logo ?? "",
          tagline: club.tagline ?? "",
          primary: club.primary ?? "",
          primaryHover: club.primaryHover ?? "",
          primarySoft: club.primarySoft ?? "",
          onPrimary: club.onPrimary ?? "",
          accent: club.accent ?? "",
          contactWhatsapp: club.contactWhatsapp ?? "",
          contactEmail: club.contactEmail ?? "",
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-nex-muted">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
