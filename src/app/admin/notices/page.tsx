import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Avisos del club</h1>
        <p className="text-sm text-muted-foreground">{notices.length} avisos publicados</p>
      </div>
      <div className="space-y-3">
        {notices.length === 0 && (
          <Card><CardContent className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Sin avisos publicados.</p>
          </CardContent></Card>
        )}
        {notices.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-barrancas-red" /> {n.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{n.body}</p>
              <p className="text-xs text-muted-foreground mt-3">{formatDate(n.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
