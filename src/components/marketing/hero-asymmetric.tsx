import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenshotFrame } from "@/components/marketing/screenshot-frame";
import { NEXCLUB_WHATSAPP_DEMO_URL } from "@/lib/constants";

/**
 * Hero v2 — asimétrico (col 5/7) con mockup del panel a la derecha.
 *
 * Reglas anti-IA en juego:
 *  - H1 corto y declarativo, en serif editorial.
 *  - Asimetría intencional: el mockup sobresale un poco del bloque.
 *  - Chip de prueba viva con números reales debajo del fold superior, no
 *    pills decorativos.
 */
export function HeroAsymmetric() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-nex-soft blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-nex-soft blur-3xl opacity-50" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Columna izquierda — 5/12 en desktop */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-nex-border bg-white/80 px-3 py-1 text-xs font-medium text-nex-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-nex animate-pulse" />
            El sistema operativo de tu club
          </div>
          <h1 className="mt-6 font-serif text-5xl sm:text-6xl md:text-7xl text-nex-ink leading-[0.95] tracking-tight">
            El club entero,<br />
            <span className="italic text-nex">en una pantalla.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base sm:text-lg text-nex-muted leading-relaxed">
            NEXCLUB ordena el padrón, las cuotas y la comunicación con las familias.
            Hecho para clubes de fútbol formativo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="bg-nex hover:bg-nex-hover text-white gap-2 shadow-lg shadow-nex/20 h-12 text-base px-6"
            >
              <a href={NEXCLUB_WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Agendá una demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-nex-border bg-white hover:bg-nex-soft text-nex-ink h-12 text-base px-6"
            >
              <a href="#producto">Ver el producto</a>
            </Button>
          </div>

          {/* Chip de prueba viva */}
          <div className="mt-10 flex items-center gap-3 rounded-full bg-white/70 border border-nex-border pl-2 pr-4 py-2 max-w-fit">
            <div className="relative h-9 w-9 rounded-full bg-white border border-nex-border overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt="Barrancas FC"
                fill
                sizes="36px"
                className="object-contain p-0.5"
              />
            </div>
            <div className="text-[13px] leading-tight">
              <div className="text-nex-ink font-medium">Ya gestiona Barrancas FC</div>
              <div className="text-nex-muted text-xs">180+ jugadores · 11 categorías</div>
            </div>
          </div>
        </div>

        {/* Columna derecha — mockup 7/12 */}
        <div className="lg:col-span-7 relative">
          <div className="relative lg:-mr-12 xl:-mr-20">
            <ScreenshotFrame
              label="Dashboard admin · Barrancas FC"
              ratio="video"
              className="rotate-[0.6deg] hover:rotate-0 transition-transform duration-700"
            />
            {/* Card flotante sobre el mockup — refuerza realismo */}
            <div className="hidden sm:flex absolute -left-6 lg:-left-10 bottom-8 lg:bottom-12 items-center gap-3 rounded-xl bg-white border border-nex-border shadow-xl shadow-nex-ink/10 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-xs font-bold">
                ✓
              </div>
              <div className="text-[12px] leading-tight">
                <div className="text-nex-ink font-semibold">Cuota cobrada</div>
                <div className="text-nex-muted">Familia López · $32.500</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
