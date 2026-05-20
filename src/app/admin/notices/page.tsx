import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateNoticeButton } from "@/components/admin/create-notice-button";
import { formatRelative, formatDateTime, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const notices = await prisma.notice.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-5">
      <PageHeader
        title="Avisos del club"
        description={`${notices.length} ${pluralize(notices.length, "aviso")} ${pluralize(notices.length, "publicado")}`}
        action={<CreateNoticeButton />}
      />

      {notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Todavía no hay avisos publicados"
          description="Cuando publiques uno, los padres lo van a ver en su portal."
        />
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <Card key={n.id} className="transition-shadow hover:shadow-md">
              <CardContent className="py-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 grid place-items-center shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{n.title}</p>
                      <span
                        title={formatDateTime(n.createdAt)}
                        className="text-xs text-muted-foreground whitespace-nowrap"
                      >
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
