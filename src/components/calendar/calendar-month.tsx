import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { eventTypeMeta } from "@/lib/events";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  title: string;
  date: Date;
  type: string;
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
// Lunes a Domingo (orden argentino)
const DOW_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Vista mensual del calendario. Server component — recibe los eventos del rango
 * y los pinta como chips de color en cada día. Click en un día scrollea a la
 * lista de eventos de ese día (que se muestra abajo en un drawer compacto).
 */
export function CalendarMonth({
  events,
  year,
  month, // 1-12
  basePath,
  fullEvents,
}: {
  events: EventItem[];
  year: number;
  month: number;
  basePath: string;
  // events sin truncar para mostrar abajo cuando se selecciona día (vacío = no mostrar)
  fullEvents?: { id: string; title: string; date: Date; endDate: Date | null; location: string | null; type: string; description: string | null }[];
}) {
  const today = new Date();
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);

  // Día de la semana del primer día (0=Dom, 1=Lun...). Ajustamos a Lun=0.
  const firstDow = (firstOfMonth.getDay() + 6) % 7;
  // Días del mes anterior que aparecen en la primera fila
  const prevPad = firstDow;
  // Total de celdas: padding inicial + días del mes, redondeado a múltiplo de 7
  const totalDays = lastOfMonth.getDate();
  const totalCells = Math.ceil((prevPad + totalDays) / 7) * 7;

  // Agrupar eventos por día
  const byDay = new Map<number, EventItem[]>();
  for (const e of events) {
    if (e.date.getFullYear() !== year || e.date.getMonth() + 1 !== month) continue;
    const d = e.date.getDate();
    const list = byDay.get(d) ?? [];
    list.push(e);
    byDay.set(d, list);
  }

  // Navegación
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const params = (y: number, m: number) => `?view=month&y=${y}&m=${m}`;

  return (
    <div className="space-y-3">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold capitalize">
            {MONTH_NAMES[month - 1]} <span className="text-muted-foreground font-medium">{year}</span>
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
            <Link href={`${basePath}${params(prevYear, prevMonth)}`} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link href={`${basePath}${params(today.getFullYear(), today.getMonth() + 1)}`}>
              Hoy
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" className="h-8 w-8">
            <Link href={`${basePath}${params(nextYear, nextMonth)}`} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {DOW_SHORT.map((d, i) => (
            <div
              key={d + i}
              className={cn(
                "px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                (i === 5 || i === 6) && "text-red-400"
              )}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: totalCells }).map((_, idx) => {
            const dayNum = idx - prevPad + 1;
            const isCurrent = dayNum >= 1 && dayNum <= totalDays;
            const date = new Date(year, month - 1, dayNum);
            const isToday = isCurrent && isSameDay(date, today);
            const dow = idx % 7;
            const isWeekend = dow === 5 || dow === 6;
            const dayEvents = isCurrent ? byDay.get(dayNum) ?? [] : [];

            return (
              <div
                key={idx}
                className={cn(
                  "border-r border-b last:border-r-0 min-h-[64px] md:min-h-[88px] p-1 md:p-1.5 relative",
                  !isCurrent && "bg-muted/20",
                  isCurrent && isWeekend && "bg-rose-50/30"
                )}
              >
                {isCurrent && (
                  <>
                    <div className="flex items-start justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          isToday && "h-5 w-5 rounded-full bg-barrancas-red text-white grid place-items-center text-[10px] font-bold",
                          !isToday && isWeekend && "text-red-500"
                        )}
                      >
                        {dayNum}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => {
                        const meta = eventTypeMeta(e.type);
                        return (
                          <a
                            key={e.id}
                            href={`#evt-${e.id}`}
                            title={e.title}
                            className={cn(
                              "block text-[10px] leading-tight truncate rounded px-1 py-0.5 cursor-pointer transition-opacity hover:opacity-80",
                              meta.tone
                            )}
                          >
                            <span className={cn("inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle", meta.dot)} />
                            <span className="align-middle">{fmtTime(e.date)} {e.title}</span>
                          </a>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} más</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lista del mes abajo (anchors para click desde el grid) */}
      {fullEvents && fullEvents.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Eventos del mes
          </p>
          {fullEvents
            .filter((e) => e.date.getFullYear() === year && e.date.getMonth() + 1 === month)
            .map((e) => {
              const meta = eventTypeMeta(e.type);
              return (
                <div
                  key={e.id}
                  id={`evt-${e.id}`}
                  className="flex items-start gap-3 border rounded-lg p-3 scroll-mt-20"
                >
                  <div className={cn("w-1 self-stretch rounded-full", meta.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "short" })} ·{" "}
                      {fmtTime(e.date)}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    {e.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                        {e.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
