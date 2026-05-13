import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChildSwitcher } from "@/components/padre/child-switcher";
import { getPadreContext } from "@/lib/padre";
import { formatDate } from "@/lib/utils";
import { FileText, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PadreDocumentosPage({ searchParams }: { searchParams: { hijo?: string } }) {
  const { children, active } = await getPadreContext(searchParams.hijo);
  if (!active) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Documentación</h1>
      <ChildSwitcher
        items={children.map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, photo: c.photo }))}
        activeId={active.id}
      />

      <Card className="border-dashed">
        <CardContent className="py-6 text-center space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">Subir nuevo documento</p>
          <p className="text-xs text-muted-foreground">Apto físico, DNI, ficha médica, etc.</p>
          <Button variant="outline" size="sm">Elegir archivo</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Cargados</h2>
        {active.documents.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin documentos cargados.</p>
          </CardContent></Card>
        ) : (
          active.documents.map((d) => (
            <Card key={d.id}>
              <CardContent className="py-3 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.type} · {formatDate(d.uploadedAt)}</p>
                </div>
                <Button asChild size="sm" variant="ghost"><a href={d.url} target="_blank" rel="noreferrer">Ver</a></Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
