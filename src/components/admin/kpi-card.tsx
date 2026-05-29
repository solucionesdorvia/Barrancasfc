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
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
            <p className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight tabular-nums truncate">{value}</p>
            {hint && <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">{hint}</p>}
            {trend && (
              <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-emerald-600" : "text-red-600")}>
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-2.5 shrink-0", t.bg, t.text)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
