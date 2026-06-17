import { Play } from "lucide-react";

/**
 * Slot para el demo del producto. Hoy muestra solo poster + play estático
 * con caption "próximamente". Cuando Remotion genere el MP4:
 *
 *   <HeroDemoSlot videoSrc="/marketing/demo.mp4" posterSrc="/marketing/demo-poster.png" />
 *
 * El <video> es `autoplay muted loop playsinline` para que reproduzca en
 * mobile sin gesto, igual que Linear/Vercel.
 */
export function HeroDemoSlot({
  videoSrc,
  posterSrc,
}: {
  videoSrc?: string;
  posterSrc?: string;
}) {
  return (
    <section className="bg-nex-ink text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">
            Demo del producto
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-white leading-[1.05] tracking-tight">
            30 segundos del panel real.{" "}
            <span className="italic text-nex-soft">Sin maquillaje.</span>
          </h2>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl shadow-black/40">
          {videoSrc ? (
            <video
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <PosterFallback />
          )}
        </div>
        <p className="mt-4 text-xs text-white/40 italic">
          {videoSrc
            ? "Grabado del panel real de Barrancas FC. Datos anonimizados."
            : "Demo del producto · próximamente."}
        </p>
      </div>
    </section>
  );
}

function PosterFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-nex-ink via-zinc-900 to-nex/30 flex flex-col">
      {/* Chrome del navegador fake */}
      <div className="h-8 px-3 flex items-center gap-1.5 border-b border-white/10 bg-white/5">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="ml-4 text-[10px] text-white/40 font-mono">
          barrancas.nexclub.app/admin
        </span>
      </div>
      <div className="flex-1 grid place-items-center">
        <div className="text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 grid place-items-center backdrop-blur">
            <Play className="h-7 w-7 text-white/80 ml-1" />
          </div>
          <div>
            <div className="text-sm text-white/60 font-medium">
              Demo del panel · 0:30
            </div>
            <div className="text-xs text-white/30 mt-1">
              Próximamente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
