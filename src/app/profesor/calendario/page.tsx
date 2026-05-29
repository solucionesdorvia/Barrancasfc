import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarList } from "@/components/calendar/calendar-list";
import { CalendarMonth } from "@/components/calendar/calendar-month";
import { CalendarViewToggle } from "@/components/calendar/view-toggle";
import { getVisibleEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function ProfesorCalendarPage({
  searchParams,
}: {
  searchParams: { view?: string; y?: string; m?: string };
}) {
  await requireRole(["PROFESOR", "ADMIN"]);
  const view: "list" | "month" = searchParams.view === "month" ? "month" : "list";
  const now = new Date();

  const targetY = searchParams.y ? Number(searchParams.y) : now.getFullYear();
  const targetM = searchParams.m ? Number(searchParams.m) : now.getMonth() + 1;

  const events = await (view === "month"
    ? getVisibleEvents({
        role: "PROFESOR",
        from: new Date(targetY, targetM - 1, 1),
        to: new Date(targetY, targetM, 0, 23, 59, 59),
      })
    : getVisibleEvents({ role: "PROFESOR", from: new Date(now.getTime() - 12 * 3600 * 1000) }));

  return (
    <div className="space-y-5">
      <PageHeader title="Calendario" description="Tus entrenamientos y partidos" />
      <Card className="p-1">
        <CardContent className="p-2 flex justify-end">
          <CalendarViewToggle view={view} basePath="/profesor/calendario" />
        </CardContent>
      </Card>
      {view === "month" ? (
        <CalendarMonth
          events={events.map((e) => ({ id: e.id, title: e.title, date: e.date, type: e.type }))}
          year={targetY}
          month={targetM}
          basePath="/profesor/calendario"
          fullEvents={events}
        />
      ) : (
        <CalendarList events={events} />
      )}
    </div>
  );
}
