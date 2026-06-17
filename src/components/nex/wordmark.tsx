import { cn } from "@/lib/utils";

/**
 * Wordmark NEXCLUB: "Nex" en --nex-ink + "Club" en --nex-primary.
 * Para el powered-by, usar tono monocromo (variant="mono").
 */
export function NexClubWordmark({
  className,
  variant = "color",
  size = "md",
}: {
  className?: string;
  variant?: "color" | "mono";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl md:text-6xl",
  } as const;

  const monoClass = "text-nex-muted";

  return (
    <span className={cn("font-bold tracking-tight", sizeMap[size], className)}>
      <span className={variant === "mono" ? monoClass : "text-nex-ink"}>NEX</span>
      <span className={variant === "mono" ? monoClass : "text-nex"}>CLUB</span>
    </span>
  );
}
