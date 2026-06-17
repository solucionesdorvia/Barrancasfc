import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEXCLUB_WHATSAPP_DEMO_URL } from "@/lib/constants";

/**
 * Bloque "humano": refuerza que detrás hay un equipo argentino que atiende
 * por WhatsApp. Sin formularios, sin SDRs. Es la anti-tesis del SaaS
 * gringo con form de 12 campos.
 */
export function HumanTeamBlock() {
  return (
    <section className="bg-nex-soft/50 border-y border-nex-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8">
            <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
              Detrás hay un equipo
            </p>
            <h2 className="mt-3 font-serif text-3xl sm:text-5xl text-nex-ink leading-[1.05] tracking-tight">
              Hablás con el equipo NEXCLUB
              <br />
              <span className="italic text-nex">en menos de 24 horas.</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-nex-muted leading-relaxed max-w-2xl">
              Sin formularios infinitos, sin SDRs, sin chatbots que te
              hacen 9 preguntas antes de mandarte con alguien.
              Te escribimos por WhatsApp y arrancamos.
            </p>
          </div>
          <div className="md:col-span-4 md:text-right">
            <Button
              asChild
              size="lg"
              className="bg-nex hover:bg-nex-hover text-white gap-2 h-12 text-base px-6 shadow-lg shadow-nex/20"
            >
              <a href={NEXCLUB_WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Escribinos
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <p className="mt-3 text-xs text-nex-muted">
              Respuesta humana, no automatizada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
