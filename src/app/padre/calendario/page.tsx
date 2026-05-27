import { requireRole } from "@/lib/auth";
import { CalendarList } from "@/components/calendar/calendar-list";
import { getVisibleEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function PadreCalendarPage() {
  const user = await requireRole("PADRE");
  const childrenCategoryIds = user.children.map((c) => c.categoryId);
  const events = await getVisibleEvents({
    role: "PADRE",
    childrenCategoryIds,
    from: new Date(Date.now() - 12 * 3600 * 1000),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Calendario</h1>
      <p className="text-sm text-muted-foreground -mt-2">Próximas actividades de tus hijos</p>
      <CalendarList events={events} />
    </div>
  );
}
