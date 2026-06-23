import Image from "next/image";

/**
 * Card grande de Barrancas FC. Reemplaza el bloque genérico "Ya lo usa
 * Barrancas FC" por algo institucional: escudo + métricas concretas +
 * quote textual + cierre con anchor al CTA.
 *
 * Cuando entren más clubes, este componente acepta una prop `club: ...`
 * y se duplica. Por ahora es específico de Barrancas para no inventar.
 */
export function BarrancasProofCard() {
  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="rounded-3xl border border-nex-border bg-gradient-to-br from-white via-nex-bg/30 to-nex-soft/30 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Columna izquierda — escudo + identidad */}
            <div className="md:col-span-4 p-8 sm:p-10 border-b md:border-b-0 md:border-r border-nex-border bg-white/60">
              <div className="relative h-24 w-24 sm:h-32 sm:w-32">
                <Image
                  src="/logo.png"
                  alt="Barrancas FC"
                  fill
                  sizes="128px"
                  className="object-contain"
                />
              </div>
              <p className="mt-6 text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
                Caso de uso · Buenos Aires
              </p>
              <h3 className="mt-1 font-serif text-3xl text-nex-ink leading-tight">
                Barrancas FC
              </h3>
              <p className="mt-2 text-sm text-nex-muted leading-relaxed">
                Club de fútbol argentino. Activo en NEXCLUB desde febrero de 2026.
              </p>
            </div>

            {/* Columna derecha — métricas + quote */}
            <div className="md:col-span-8 p-8 sm:p-10 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat value="180+" label="jugadores activos" />
                <Stat value="11" label="categorías" />
                <Stat value="95%" label="cuotas al día" />
                <Stat value="4 meses" label="con NEXCLUB" />
              </div>
              <blockquote className="border-l-4 border-nex pl-5">
                <p className="text-base sm:text-lg text-nex-ink leading-relaxed">
                  &ldquo;Pasamos de perseguir cuotas por WhatsApp a tener el club
                  entero ordenado en una sola pantalla. Las familias pagan online,
                  los profes ven su categoría, y nosotros vemos todo.&rdquo;
                </p>
                <footer className="mt-4 text-sm text-nex-muted">
                  — Dirigencia, Barrancas FC
                </footer>
              </blockquote>
              <p className="text-sm">
                <a
                  href="#contacto"
                  className="text-nex hover:text-nex-hover font-medium inline-flex items-center gap-1.5"
                >
                  ¿Querés aparecer acá con tu club?
                  <span aria-hidden>→</span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-3xl sm:text-4xl text-nex-ink leading-none">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] uppercase tracking-widest text-nex-muted font-medium">
        {label}
      </div>
    </div>
  );
}
