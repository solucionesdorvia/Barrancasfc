import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PadreAvisosPage() {
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Avisos del club</h1>
      <div className="space-y-2">
        {notices.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin avisos.</p>
          </CardContent></Card>
        )}
        {notices.map((n) => (
          <Card key={n.id}>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-barrancas-red" />
                <p className="text-sm font-semibold">{n.title}</p>
              </div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(n.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
