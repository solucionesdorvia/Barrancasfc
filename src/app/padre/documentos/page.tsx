import { FileText, Upload, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { getPadreContext } from "@/lib/padre";
import { formatDate, formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  DNI: "DNI",
  BIRTH_CERT: "Partida de nacimiento",
  MEDICAL: "Ficha médica",
  REPORT_CARD: "Boletín",
  OTHER: "Otro",
};

export default async function PadreDocumentosPage({ searchParams }: { searchParams: { hijo?: string } }) {
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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Documentación</h1>

      <ChildSwitcher
        items={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, photo: c.photo }))}
        activeId={active.id}
      />

      <Card className="border-dashed border-2">
        <CardContent className="py-6 text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-full bg-zinc-100 grid place-items-center">
            <Upload className="h-5 w-5 text-zinc-600" />
          </div>
          <p className="text-sm font-medium">Subir nuevo documento</p>
          <p className="text-xs text-muted-foreground">Apto físico, DNI, ficha médica, partida.</p>
          <Button variant="outline" size="sm" disabled title="Próximamente">
            Elegir archivo
          </Button>
          <p className="text-[10px] text-muted-foreground">Función disponible muy pronto.</p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">
          Cargados {active.documents.length > 0 && <span className="text-muted-foreground font-normal">({active.documents.length})</span>}
        </h2>
        {active.documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin documentos cargados"
            description={`Subí el DNI o ficha médica de ${active.firstName} para tenerlo todo en un solo lugar.`}
          />
        ) : (
          active.documents.map((d) => (
            <Card key={d.id} className="transition-shadow hover:shadow-md">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-100 text-violet-700 grid place-items-center shrink-0">
                  {d.type === "MEDICAL" ? <ShieldCheck className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOC_TYPE_LABEL[d.type] ?? d.type} · <span title={formatDate(d.uploadedAt)}>{formatRelative(d.uploadedAt)}</span>
                  </p>
                </div>
                <Badge variant="secondary" className="hidden sm:inline">Cargado</Badge>
                <Button asChild size="sm" variant="ghost">
                  <a href={d.url} target="_blank" rel="noreferrer">Ver</a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
