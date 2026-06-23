import { Plus } from "lucide-react";

/**
 * FAQ con <details>/<summary> nativo. Accesible por default (teclado, screen
 * readers) y sin runtime JS. Más liviano que un accordion radix; encaja con
 * la estética institucional que buscamos.
 */

type FaqItem = { q: string; a: string };

const FAQ: FaqItem[] = [
  {
    q: "¿Cuánto cuesta?",
    a: "Depende del tamaño del club. Te lo decimos en la demo. No vendemos planes empaquetados — el precio se arma con el padrón real que tenés y se paga mes a mes.",
  },
  {
    q: "¿Y si quiero probarlo?",
    a: "Te damos 30 días con tu club cargado por nosotros. Sin tarjeta, sin compromiso. Si al mes no te suma, lo cerrás y exportás todo.",
  },
  {
    q: "¿Migramos del Excel?",
    a: "Sí, lo migramos nosotros. Es parte del setup inicial. Vos nos mandás las planillas que tengas y el padrón queda cargado en un par de días.",
  },
  {
    q: "¿Y si el club cambia de comisión?",
    a: "El club es dueño de sus datos. Exportás todo cuando quieras — padrón, pagos, asistencias — en CSV o Excel. NEXCLUB no retiene información del club.",
  },
  {
    q: "¿Qué pasa con los fichajes de AFA?",
    a: "Eso lo seguís haciendo en ComET, no competimos con eso. NEXCLUB se ocupa de todo lo que pasa entre fichaje y fichaje: padrón interno, cuotas, asistencia, comunicación con las familias.",
  },
  {
    q: "¿Atienden por WhatsApp?",
    a: "Sí, soporte 1:1 directo con el equipo. Sin formularios de ticket, sin esperar 48h. Si tenés un problema un sábado a las 9pm, alguien lo lee.",
  },
];

export function FaqAccordion() {
  return (
    <section id="faq" className="bg-nex-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-nex-ink leading-[1.05] tracking-tight">
            Lo que los dirigentes <span className="italic text-nex">siempre preguntan.</span>
          </h2>
        </div>
        <ul className="mt-12 divide-y divide-nex-border border-y border-nex-border">
          {FAQ.map((item) => (
            <li key={item.q}>
              <details className="group">
                <summary className="cursor-pointer list-none py-6 flex items-start justify-between gap-6">
                  <span className="text-lg sm:text-xl text-nex-ink font-medium leading-tight">
                    {item.q}
                  </span>
                  <span className="mt-1 h-7 w-7 rounded-full bg-white border border-nex-border grid place-items-center shrink-0 text-nex-muted group-open:rotate-45 group-open:bg-nex group-open:border-nex group-open:text-white transition-all duration-200">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="pb-6 pr-12 text-base text-nex-muted leading-relaxed -mt-2">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
