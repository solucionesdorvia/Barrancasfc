import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  showText = true,
  size = 36,
  textTone = "default",
}: {
  className?: string;
  showText?: boolean;
  size?: number;
  textTone?: "default" | "light";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt="NEXCLUB Barrancas"
        width={size}
        height={size}
        priority
        className="object-contain shrink-0"
        style={{ width: size, height: "auto" }}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("text-sm font-bold tracking-tight", textTone === "light" && "text-white")}>
            NEXCLUB
          </span>
          <span
            className={cn(
              "text-[10px] uppercase tracking-widest",
              textTone === "light" ? "text-zinc-400" : "text-muted-foreground"
            )}
          >
            Barrancas FC
          </span>
        </div>
      )}
    </div>
  );
}
