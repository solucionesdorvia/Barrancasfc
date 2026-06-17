import Link from "next/link";
import { ExternalLink, Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ClubsListPage() {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      logo: true,
      primary: true,
      customDomain: true,
      createdAt: true,
      _count: { select: { users: true, players: true, categories: true } },
    },
  });

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nexclub.app";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">NEXCLUB</p>
          <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
          <p className="text-sm text-nex-muted mt-1">
            {clubs.length} {clubs.length === 1 ? "club registrado" : "clubes registrados"}
          </p>
        </div>
        <Button asChild className="bg-nex hover:bg-nex-hover text-white gap-2">
          <Link href="/super/clubs/new"><Plus className="h-4 w-4" /> Nuevo club</Link>
        </Button>
      </div>

      {clubs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-nex-muted mb-3">No hay clubes cargados.</p>
            <Button asChild>
              <Link href="/super/clubs/new">Crear el primero</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clubs.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-md grid place-items-center shrink-0 text-white text-xs font-bold uppercase"
                    style={{ background: c.primary ?? "#0F766E" }}
                  >
                    {c.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/super/clubs/${c.id}`}
                        className="font-semibold truncate hover:text-nex"
                      >
                        {c.name}
                      </Link>
                      {c.slug && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {c.slug}
                        </Badge>
                      )}
                    </div>
                    {c.tagline && <p className="text-xs text-nex-muted mt-0.5 truncate">{c.tagline}</p>}
                    <p className="text-[11px] text-nex-muted mt-2">
                      {c._count.users} users · {c._count.players} jugadores · {c._count.categories} categorías
                    </p>
                    {c.slug && (
                      <a
                        href={`https://${c.slug}.${rootDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-nex hover:underline mt-1.5"
                      >
                        {c.slug}.{rootDomain} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Link
                    href={`/super/clubs/${c.id}`}
                    aria-label={`Editar ${c.name}`}
                    className="shrink-0 text-nex-muted hover:text-nex"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
