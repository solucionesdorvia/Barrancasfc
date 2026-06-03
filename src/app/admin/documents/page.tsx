import { FileText } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, formatDate, initials, fullName, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  DNI: "DNI",
  BIRTH_CERT: "Partida de nacimiento",
  MEDICAL: "Ficha médica",
  REPORT_CARD: "Boletín",
  OTHER: "Otro",
};

export default async function DocumentsPage() {
  const docs = await prisma.document.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      uploadedAt: true,
      uploadedBy: true,
      player: {
        select: { id: true, firstName: true, lastName: true, photo: true },
      },
    },
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documentación"
        description={`${docs.length} ${pluralize(docs.length, "documento")} ${pluralize(docs.length, "registrado")}`}
      />

      {docs.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Sin documentación cargada"
            description="Subí archivos desde la ficha de cada jugador o desde el portal del padre."
            bare
            className="py-12"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map((d) => (
            <Card key={d.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{DOC_TYPE_LABEL[d.type] ?? d.type}</Badge>
                  <span title={formatDate(d.uploadedAt)} className="text-xs text-muted-foreground">
                    {formatRelative(d.uploadedAt)}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 grid place-items-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2" title={d.name}>
                      {d.name || <span className="text-muted-foreground italic">Sin nombre</span>}
                    </p>
                    {d.uploadedBy && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={`Subido por ${d.uploadedBy}`}>
                        por {d.uploadedBy}
                      </p>
                    )}
                  </div>
                </div>
                <Link href={`/admin/players/${d.player.id}`} className="flex items-center gap-2 hover:underline w-fit">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={d.player.photo ?? undefined} />
                    <AvatarFallback className="text-[10px]">{initials(fullName(d.player.firstName, d.player.lastName))}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {d.player.firstName} {d.player.lastName}
                  </span>
                </Link>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <a href={d.url} target="_blank" rel="noopener noreferrer">Ver documento</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
