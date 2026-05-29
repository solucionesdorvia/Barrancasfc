import Link from "next/link";
import { Calendar as CalIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggle entre vista "Lista" y "Mes". Cada link preserva los demás query
 * params relevantes (range, y, m, etc.) si los pasás.
 */
export function CalendarViewToggle({
  view,
  basePath,
  extraQS = "",
}: {
  view: "list" | "month";
  basePath: string;
  extraQS?: string;
}) {
  const items: { value: "list" | "month"; label: string; icon: typeof CalIcon }[] = [
    { value: "month", label: "Mes", icon: CalIcon },
    { value: "list", label: "Lista", icon: List },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-muted rounded-md border">
      {items.map((it) => {
        const Icon = it.icon;
        const active = view === it.value;
        const href = it.value === "month"
          ? `${basePath}?view=month${extraQS}`
          : `${basePath}${extraQS ? `?${extraQS.replace(/^&/, "")}` : ""}`;
        return (
          <Link
            key={it.value}
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
              active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
