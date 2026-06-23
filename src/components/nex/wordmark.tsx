import { cn } from "@/lib/utils";

/**
 * Wordmark NEXCLUB.
 * - "color": NEX en ink + CLUB en primary (default, sobre fondos claros).
 * - "light": NEX en blanco + CLUB en soft (para fondos oscuros — el variant
 *   "color" se perdía sobre hero oscuro de sign-in/sign-up).
 * - "mono": gris uniforme para uso secundario (powered-by, footer subtle).
 */
export function NexClubWordmark({
  className,
  variant = "color",
  size = "md",
}: {
  className?: string;
  variant?: "color" | "mono" | "light";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-5xl md:text-6xl",
  } as const;

  const nexClass =
    variant === "mono" ? "text-nex-muted" : variant === "light" ? "text-white" : "text-nex-ink";
  const clubClass =
    variant === "mono" ? "text-nex-muted" : variant === "light" ? "text-nex-soft" : "text-nex";

  return (
    <span className={cn("font-bold tracking-tight", sizeMap[size], className)}>
      <span className={nexClass}>NEX</span>
      <span className={clubClass}>CLUB</span>
    </span>
  );
}
