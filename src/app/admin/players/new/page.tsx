import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

export default function NewPlayerPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/players"><ArrowLeft className="h-4 w-4" /> Volver</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Construction className="h-5 w-5 text-amber-600" /> Próximamente</CardTitle>
          <CardDescription>El formulario de alta manual estará en el sistema final.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Por ahora, podés <strong>importar jugadores desde Excel</strong> usando el botón en el listado de jugadores. Cubrimos el flujo de carga masiva, que es el más usado por la administración.
        </CardContent>
      </Card>
    </div>
  );
}
