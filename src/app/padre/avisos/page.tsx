import { Bell, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticePoll } from "@/components/notice-poll";
import { requireUser } from "@/lib/auth";
import { formatRelative, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type NoticeWithVotes = Awaited<ReturnType<typeof prisma.notice.findMany<{ include: { votes: true } }>>>[number];

export default async function PadreAvisosPage() {
  const user = await requireUser();
  const notices = await prisma.notice
    .findMany({
      orderBy: { createdAt: "desc" },
      include: { votes: true },
    })
    .catch(() => [] as NoticeWithVotes[]);

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
          notices.map((n) => {
            const isPoll = Array.isArray(n.pollOptions) && n.pollOptions.length > 0;
            const myVote = isPoll
              ? (n.votes ?? []).find((v) => v.userId === user.id)?.optionIdx ?? null
              : null;
            const counts: number[] = isPoll
              ? n.pollOptions.map((_, idx) => (n.votes ?? []).filter((v) => v.optionIdx === idx).length)
              : [];
            return (
              <Card key={n.id} className="transition-shadow hover:shadow-md">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                        isPoll ? "bg-violet-100 text-violet-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {isPoll ? <BarChart3 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate">{n.title}</p>
                          {isPoll && (
                            <Badge variant="outline" className="text-[10px] shrink-0 border-violet-300 text-violet-700">
                              Encuesta
                            </Badge>
                          )}
                        </div>
                        <span
                          title={formatDate(n.createdAt)}
                          className="text-[10px] text-muted-foreground whitespace-nowrap"
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
                          myVote={myVote}
                          counts={counts}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
