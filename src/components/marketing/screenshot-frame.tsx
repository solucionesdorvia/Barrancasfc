import Image from "next/image";

/**
 * Wrapper genérico para mostrar una captura del panel real. Si `src` está
 * presente, renderiza la imagen con sombra y borde sutil. Si no, muestra un
 * placeholder elegante con el label (nunca stock imagery).
 *
 * Diseñado para que cuando se reemplacen los placeholders por screenshots
 * reales, no haya que tocar layout — solo pasar `src`.
 */
export function ScreenshotFrame({
  src,
  alt,
  label,
  ratio = "video",
  className = "",
}: {
  src?: string;
  alt?: string;
  label: string;
  ratio?: "video" | "square" | "portrait";
  className?: string;
}) {
  const ratioClass =
    ratio === "video" ? "aspect-video" : ratio === "square" ? "aspect-square" : "aspect-[3/4]";

  return (
    <div
      className={`relative ${ratioClass} rounded-2xl overflow-hidden border border-nex-border bg-white shadow-xl shadow-nex-ink/10 ${className}`}
    >
      {src ? (
        <Image src={src} alt={alt ?? label} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      ) : (
        <PlaceholderInterior label={label} />
      )}
    </div>
  );
}

function PlaceholderInterior({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-nex-soft/40 via-white to-nex-bg flex flex-col">
      <div className="h-7 border-b border-nex-border/60 px-3 flex items-center gap-1.5 bg-white/80">
        <span className="h-2 w-2 rounded-full bg-nex-border" />
        <span className="h-2 w-2 rounded-full bg-nex-border" />
        <span className="h-2 w-2 rounded-full bg-nex-border" />
      </div>
      <div className="flex-1 grid place-items-center px-6">
        <div className="text-center space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-nex-muted font-semibold">
            Captura del panel
          </div>
          <div className="text-sm text-nex-ink font-medium">{label}</div>
          <div className="text-[11px] text-nex-muted/80">Reemplazá con screenshot real</div>
        </div>
      </div>
    </div>
  );
}
