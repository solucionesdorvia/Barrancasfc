import Image from "next/image";

/**
 * Bar de instituciones — debajo del hero. Hoy solo Barrancas FC; los slots
 * vacíos "Tu club acá" son intencionales (refuerzan tracción + espacio
 * visual para sumar logos). Cuando entren más clubes, se reemplazan slots
 * por escudos reales.
 */
export function TrustedByStrip() {
  return (
    <section className="bg-white border-y border-nex-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-center">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            Confían en NEXCLUB
          </p>
          <p className="text-sm text-nex-ink mt-0.5">
            Clubes argentinos de formativas, ya en producción.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-4 md:justify-end">
          <ClubChip name="Barrancas FC" logo="/logo.png" />
          <PlaceholderSlot />
          <PlaceholderSlot />
          <PlaceholderSlot />
        </ul>
      </div>
    </section>
  );
}

function ClubChip({ name, logo }: { name: string; logo: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0">
        <Image src={logo} alt={name} fill sizes="48px" className="object-contain" />
      </div>
      <span className="text-sm font-semibold text-nex-ink whitespace-nowrap">{name}</span>
    </li>
  );
}

function PlaceholderSlot() {
  return (
    <li className="flex items-center gap-3 text-nex-muted/50">
      <div className="h-12 w-12 rounded-full border-2 border-dashed border-nex-border" />
      <span className="text-xs italic whitespace-nowrap">Tu club acá</span>
    </li>
  );
}
