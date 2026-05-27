import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarList } from "@/components/calendar/calendar-list";
import { EventDialog } from "@/components/admin/event-dialog";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { getVisibleEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  await requireRole("ADMIN");

  const now = new Date();
  const range = searchParams.range === "past" ? "past" : "upcoming";
  const from = range === "upcoming" ? new Date(now.getTime() - 12 * 3600 * 1000) : undefined;
  const to = range === "past" ? now : undefined;

  const [events, categories] = await Promise.all([
    getVisibleEvents({ role: "ADMIN", from, to }),
    prisma.category.findMany({ orderBy: [{ type: "asc" }, { year: "desc" }] }),
  ]);

  const list = range === "past" ? events.reverse() : events;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario"
        description="Entrenamientos, partidos, reuniones y avisos del club"
        action={<EventDialog categories={categories} />}
      />

      <Card className="p-1">
        <CardContent className="p-2 flex gap-2 text-sm">
          <FilterLink active={range === "upcoming"} href="/admin/calendario" label="Próximos" />
          <FilterLink active={range === "past"} href="/admin/calendario?range=past" label="Pasados" />
        </CardContent>
      </Card>

      <CalendarList
        events={list}
        canManage
        deleteSlot={(id, title) => <DeleteEventButton eventId={id} title={title} />}
      />
    </div>
  );
}

function FilterLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <a
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-barrancas-red text-white" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </a>
  );
}
