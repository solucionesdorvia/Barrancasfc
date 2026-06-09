import { Bell, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateNoticeButton } from "@/components/admin/create-notice-button";
import { NoticePoll } from "@/components/notice-poll";
import { formatRelative, formatDateTime, pluralize } from "@/lib/format";

export const dynamic = "force-dynamic";

type NoticeWithVotes = Awaited<ReturnType<typeof prisma.notice.findMany<{ include: { votes: true } }>>>[number];

export default async function NoticesPage() {
  const notices = await prisma.notice
    .findMany({
      orderBy: { createdAt: "desc" },
      include: { votes: true },
    })
    .catch(() => [] as NoticeWithVotes[]);

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
          {notices.map((n) => {
            const isPoll = Array.isArray(n.pollOptions) && n.pollOptions.length > 0;
            const counts: number[] = isPoll
              ? n.pollOptions.map((_, idx) => (n.votes ?? []).filter((v) => v.optionIdx === idx).length)
              : [];
            return (
              <Card key={n.id} className="transition-shadow hover:shadow-md">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${
                        isPoll ? "bg-violet-100 text-violet-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isPoll ? <BarChart3 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-semibold truncate">{n.title}</p>
                          {isPoll && (
                            <Badge variant="outline" className="text-[10px] shrink-0 border-violet-300 text-violet-700">
                              Encuesta
                            </Badge>
                          )}
                        </div>
                        <span
                          title={formatDateTime(n.createdAt)}
                          className="text-xs text-muted-foreground whitespace-nowrap"
                        >
                          {formatRelative(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{n.body}</p>

                      {isPoll && (
                        <NoticePoll
                          noticeId={n.id}
                          options={n.pollOptions}
                          closesAt={n.pollClosesAt ?? null}
                          myVote={null}
                          counts={counts}
                          showResults
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
