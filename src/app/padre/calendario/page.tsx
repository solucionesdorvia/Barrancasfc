import { requireRole } from "@/lib/auth";
import { CalendarList } from "@/components/calendar/calendar-list";
import { CalendarMonth } from "@/components/calendar/calendar-month";
import { CalendarViewToggle } from "@/components/calendar/view-toggle";
import { getVisibleEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function PadreCalendarPage({
  searchParams,
}: {
  searchParams: { view?: string; y?: string; m?: string };
}) {
  const user = await requireRole("PADRE");
  const view: "list" | "month" = searchParams.view === "month" ? "month" : "list";
  const now = new Date();

  const targetY = searchParams.y ? Number(searchParams.y) : now.getFullYear();
  const targetM = searchParams.m ? Number(searchParams.m) : now.getMonth() + 1;

  const childrenCategoryIds = (user.children ?? []).map((c) => c.categoryId);
  const events = await (view === "month"
    ? getVisibleEvents({
        role: "PADRE",
        childrenCategoryIds,
        from: new Date(targetY, targetM - 1, 1),
        to: new Date(targetY, targetM, 0, 23, 59, 59),
      })
    : getVisibleEvents({
        role: "PADRE",
        childrenCategoryIds,
        from: new Date(now.getTime() - 12 * 3600 * 1000),
      }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Calendario</h1>
          <p className="text-xs text-muted-foreground">Actividades de tus hijos</p>
        </div>
        <CalendarViewToggle view={view} basePath="/padre/calendario" />
      </div>
      {view === "month" ? (
        <CalendarMonth
          events={events.map((e) => ({ id: e.id, title: e.title, date: e.date, type: e.type }))}
          year={targetY}
          month={targetM}
          basePath="/padre/calendario"
          fullEvents={events}
        />
      ) : (
        <CalendarList events={events} />
      )}
    </div>
  );
}
