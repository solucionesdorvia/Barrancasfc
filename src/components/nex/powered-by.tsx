import Link from "next/link";
import { cn } from "@/lib/utils";
import { NexClubWordmark } from "./wordmark";

/**
 * Pie monocromo "Powered by NEXCLUB". Va en el footer del panel y en el
 * pie del login. Jamás compite con el color del club: usa tono
 * --nex-text-secondary.
 */
export function PoweredByNexClub({
  className,
  align = "center",
}: {
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <Link
      href="https://nexclub.app"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-nex-muted hover:text-nex-ink transition-colors",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        className
      )}
    >
      Powered by <NexClubWordmark variant="mono" size="sm" />
    </Link>
  );
}
