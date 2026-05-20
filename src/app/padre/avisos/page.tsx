import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PadreAvisosPage() {
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Avisos del club</h1>
      <div className="space-y-2">
        {notices.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin avisos por ahora"
            description="Cuando el club publique novedades, vas a verlas acá."
          />
        ) : (
          notices.map((n) => (
            <Card key={n.id} className="transition-shadow hover:shadow-md">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 grid place-items-center shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      <span title={formatDate(n.createdAt)} className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
