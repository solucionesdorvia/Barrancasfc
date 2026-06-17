import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar as CalIcon } from "lucide-react";
import { eventTypeMeta } from "@/lib/events";
import { formatDate } from "@/lib/format";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  endDate: Date | null;
  location: string | null;
  type: string;
  audience: string;
  categoryId: string | null;
  seriesId?: string | null;
};

const DOW = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function CalendarList({
  events,
  canManage,
  deleteSlot,
  emptyHref,
}: {
  events: EventItem[];
  canManage?: boolean;
  deleteSlot?: (eventId: string, title: string, isSeries: boolean) => React.ReactNode;
  emptyHref?: string;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalIcon}
        title="No hay eventos próximos"
        description={emptyHref ? "Creá el primer evento para que aparezca acá." : "Cuando el club sume entrenamientos o partidos, los vas a ver acá."}
      />
    );
  }

  // Agrupar por día
  const byDay = new Map<string, { date: Date; items: EventItem[] }>();
  for (const e of events) {
    const k = dayKey(e.date);
    const existing = byDay.get(k);
    if (existing) existing.items.push(e);
    else byDay.set(k, { date: new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()), items: [e] });
  }

  return (
    <div className="space-y-5">
      {Array.from(byDay.values()).map((day) => (
        <div key={dayKey(day.date)}>
          <div className="flex items-baseline gap-2 mb-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {DOW[day.date.getDay()]}
            </p>
            <p className="text-sm font-medium">{formatDate(day.date)}</p>
          </div>
          <div className="space-y-2">
            {day.items.map((e) => {
              const meta = eventTypeMeta(e.type);
              return (
                <Card key={e.id} className="transition-shadow hover:shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={`w-1.5 ${meta.dot}`} />
                      <div className="flex-1 p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-tight">{e.title}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {fmtTime(e.date)}
                                {e.endDate ? ` - ${fmtTime(e.endDate)}` : ""}
                              </span>
                              {e.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {e.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${meta.tone}`}>{meta.label}</Badge>
                        </div>
                        {e.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{e.description}</p>
                        )}
                        {canManage && deleteSlot && (
                          <div className="flex justify-end pt-1">{deleteSlot(e.id, e.title, !!e.seriesId)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
      {emptyHref && (
        <p className="text-xs text-center text-muted-foreground pt-2">
          ¿No encontrás un evento? <Link href={emptyHref} className="text-club underline">Ver pasados</Link>
        </p>
      )}
    </div>
  );
}
