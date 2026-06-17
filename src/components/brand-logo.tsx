import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo del panel: escudo del club + wordmark "NEXCLUB" + subtítulo con el
 * nombre del club. El nombre y la URL del logo se pasan como props desde
 * el server component que lee el club actual de DB.
 *
 * Si no recibe `clubName` (ej. ruta sin contexto de club), oculta el
 * subtítulo y muestra solo "NEXCLUB" como branding puro de plataforma.
 */
export function BrandLogo({
  className,
  showText = true,
  size = 36,
  textTone = "default",
  clubName,
  logoUrl,
}: {
  className?: string;
  showText?: boolean;
  size?: number;
  textTone?: "default" | "light";
  clubName?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={logoUrl || "/logo.png"}
        alt={clubName ? `NEXCLUB · ${clubName}` : "NEXCLUB"}
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
          {clubName && (
            <span
              className={cn(
                "text-[10px] uppercase tracking-widest",
                textTone === "light" ? "text-zinc-400" : "text-muted-foreground"
              )}
            >
              {clubName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
