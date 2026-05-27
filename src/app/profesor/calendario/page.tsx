import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarList } from "@/components/calendar/calendar-list";
import { getVisibleEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function ProfesorCalendarPage() {
  await requireRole(["PROFESOR", "ADMIN"]);
  const events = await getVisibleEvents({
    role: "PROFESOR",
    from: new Date(Date.now() - 12 * 3600 * 1000),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Calendario" description="Tus entrenamientos y partidos próximos" />
      <CalendarList events={events} />
    </div>
  );
}
