import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const docs = await prisma.document.findMany({
    include: { player: true },
    orderBy: { uploadedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documentación</h1>
        <p className="text-sm text-muted-foreground">{docs.length} documentos registrados</p>
      </div>

      {docs.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aún no hay documentación cargada.</p>
          <p className="text-xs mt-1">Subí archivos desde la ficha de cada jugador.</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> {d.name}</CardTitle>
                <CardDescription>
                  <Link href={`/admin/players/${d.player.id}`} className="flex items-center gap-2 mt-1 hover:underline">
                    <Avatar className="h-5 w-5"><AvatarImage src={d.player.photo ?? undefined} /><AvatarFallback>{initials(`${d.player.firstName} ${d.player.lastName}`)}</AvatarFallback></Avatar>
                    {d.player.firstName} {d.player.lastName}
                  </Link>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="outline">{d.type}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(d.uploadedAt)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
