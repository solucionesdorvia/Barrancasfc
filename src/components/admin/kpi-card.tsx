import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  trend?: { value: string; positive?: boolean };
}

const TONES = {
  default: { bg: "bg-zinc-100", text: "text-zinc-700" },
  success: { bg: "bg-emerald-100", text: "text-emerald-700" },
  warning: { bg: "bg-amber-100", text: "text-amber-700" },
  danger: { bg: "bg-red-100", text: "text-red-700" },
  info: { bg: "bg-blue-100", text: "text-blue-700" },
} as const;

export function KpiCard({ label, value, hint, icon: Icon, tone = "default", trend }: KpiCardProps) {
  const t = TONES[tone];
  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        {/* Header: label + icon chico, en una línea */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <div className={cn("rounded-md p-1.5 sm:p-2 shrink-0", t.bg, t.text)}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>

        {/* Value: full-width, sin truncate. Tamaño responsive conservador
            para que "$ 11.880.000" entre en 150px de ancho en mobile. */}
        <p className="mt-2 text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight tabular-nums leading-tight break-words">
          {value}
        </p>
        {hint && <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">{hint}</p>}
        {trend && (
          <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-emerald-600" : "text-red-600")}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
