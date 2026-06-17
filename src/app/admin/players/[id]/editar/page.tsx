import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PlayerProfileForm } from "@/components/player-profile-form";
import { UploadDocumentButton } from "@/components/admin/upload-document-button";
import { DocumentRow } from "@/components/admin/document-row";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  DNI: "DNI",
  DNI_FRONT: "DNI — Frente",
  DNI_BACK: "DNI — Dorso",
  BIRTH_CERT: "Partida de nacimiento",
  MEDICAL: "Ficha médica / Apto",
  PARENT_DOC: "Doc. del padre/tutor",
  REPORT_CARD: "Boletín / Constancia",
  OTHER: "Otro",
};

export default async function EditPlayerProfilePage({ params }: { params: { id: string } }) {
  await requireRole("ADMIN");
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { documents: { orderBy: { uploadedAt: "desc" } } },
  });
  if (!player) notFound();

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href={`/admin/players/${player.id}`}><ArrowLeft className="h-4 w-4" /> Volver a la ficha</Link>
      </Button>
      <PageHeader
        title={`Editar perfil — ${player.lastName}, ${player.firstName}`}
        description="Datos personales, contacto, escolaridad, administrativo y documentación"
      />
      <PlayerProfileForm player={player} isAdmin />

      {/* Documentación — subir / ver / borrar */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Documentación</CardTitle>
            <CardDescription>
              {player.documents.length === 0
                ? "Todavía no hay documentos cargados"
                : `${player.documents.length} ${player.documents.length === 1 ? "archivo" : "archivos"} — podés ver, subir o eliminar desde acá`}
            </CardDescription>
          </div>
          <UploadDocumentButton
            player={{ id: player.id, firstName: player.firstName, lastName: player.lastName }}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {player.documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sin documentación cargada"
              description="Apretá 'Subir documento' arriba para sumar DNI, apto físico, partida, etc."
              bare
            />
          ) : (
            player.documents.map((d) => (
              <DocumentRow
                key={d.id}
                id={d.id}
                name={d.name}
                typeLabel={DOC_TYPE_LABEL[d.type] ?? d.type}
                uploadedHint={formatDate(d.uploadedAt)}
                canDelete
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
