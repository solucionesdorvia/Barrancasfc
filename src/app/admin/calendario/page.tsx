import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarList } from "@/components/calendar/calendar-list";
import { CalendarMonth } from "@/components/calendar/calendar-month";
import { CalendarViewToggle } from "@/components/calendar/view-toggle";
import { EventDialog } from "@/components/admin/event-dialog";
import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { getVisibleEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: { range?: string; view?: string; y?: string; m?: string };
}) {
  await requireRole("ADMIN");

  const view: "list" | "month" = searchParams.view === "month" ? "month" : "list";
  const now = new Date();

  const [events, categories] = await Promise.all([
    // Para mes traemos un rango más amplio (mes seleccionado completo)
    view === "month"
      ? (async () => {
          const y = searchParams.y ? Number(searchParams.y) : now.getFullYear();
          const m = searchParams.m ? Number(searchParams.m) : now.getMonth() + 1;
          const from = new Date(y, m - 1, 1);
          const to = new Date(y, m, 0, 23, 59, 59);
          return getVisibleEvents({ role: "ADMIN", from, to });
        })()
      : (async () => {
          const range = searchParams.range === "past" ? "past" : "upcoming";
          const from = range === "upcoming" ? new Date(now.getTime() - 12 * 3600 * 1000) : undefined;
          const to = range === "past" ? now : undefined;
          const evs = await getVisibleEvents({ role: "ADMIN", from, to });
          return range === "past" ? evs.reverse() : evs;
        })(),
    prisma.category.findMany({ orderBy: [{ type: "asc" }, { year: "desc" }] }),
  ]);

  const targetY = searchParams.y ? Number(searchParams.y) : now.getFullYear();
  const targetM = searchParams.m ? Number(searchParams.m) : now.getMonth() + 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario"
        description="Entrenamientos, partidos, reuniones y avisos del club"
        action={<EventDialog categories={categories} />}
      />

      <Card className="p-1">
        <CardContent className="p-2 flex flex-wrap items-center justify-between gap-3">
          {view === "list" ? (
            <div className="flex gap-2 text-sm">
              <FilterLink active={searchParams.range !== "past"} href="/admin/calendario" label="Próximos" />
              <FilterLink active={searchParams.range === "past"} href="/admin/calendario?range=past" label="Pasados" />
            </div>
          ) : <div />}
          <CalendarViewToggle view={view} basePath="/admin/calendario" />
        </CardContent>
      </Card>

      {view === "month" ? (
        <CalendarMonth
          events={events.map((e) => ({ id: e.id, title: e.title, date: e.date, type: e.type }))}
          year={targetY}
          month={targetM}
          basePath="/admin/calendario"
          fullEvents={events}
        />
      ) : (
        <CalendarList
          events={events}
          canManage
          deleteSlot={(id, title, isSeries) => (
            <DeleteEventButton eventId={id} title={title} isSeries={isSeries} />
          )}
        />
      )}
    </div>
  );
}

function FilterLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <a
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-club text-white" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </a>
  );
}
