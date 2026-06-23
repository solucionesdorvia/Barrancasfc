import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { HeroAsymmetric } from "@/components/marketing/hero-asymmetric";
import { TrustedByStrip } from "@/components/marketing/trusted-by-strip";
import { ThreeActsSection } from "@/components/marketing/three-acts-section";
import { HeroDemoSlot } from "@/components/marketing/hero-demo-slot";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { BarrancasProofCard } from "@/components/marketing/barrancas-proof-card";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HumanTeamBlock } from "@/components/marketing/human-team-block";
import { RevealOnScroll } from "@/components/marketing/reveal-on-scroll";
import { prisma } from "@/lib/prisma";
import { NEXCLUB_WHATSAPP_DEMO_URL } from "@/lib/constants";

export default async function NexClubLandingPage() {
  // Si el host es un subdomain de club (`<slug>.nexclub.app`), la `/` no
  // sirve la landing — la persona ya entró a "su club" y la queremos
  // mandar directo al panel. El middleware inyecta `x-club-slug`.
  const clubSlug = headers().get("x-club-slug");
  if (clubSlug) {
    const club = await prisma.club.findUnique({
      where: { slug: clubSlug },
      select: { id: true },
    });
    if (!club) notFound();
    const { userId } = auth();
    redirect(userId ? "/admin" : "/sign-in");
  }

  return (
    <main>
      <MarketingHeader />

      {/* 1. HERO asimétrico con mockup */}
      <HeroAsymmetric />

      {/* 2. Bar de instituciones */}
      <RevealOnScroll><TrustedByStrip /></RevealOnScroll>

      {/* 3. El problema — tipografía editorial */}
      <RevealOnScroll>
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
              El problema
            </p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-nex-ink leading-[1.05] tracking-tight">
              El Excel<br />
              <span className="italic">ya no te alcanza.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pl-8 md:border-l border-nex-border">
            <ul className="space-y-5 text-base sm:text-lg text-nex-ink/85 leading-relaxed">
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-nex/60 shrink-0 leading-none">→</span>
                <span>Una planilla por categoría. Cuando alguien edita la de Sub-15, nadie se entera.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-nex/60 shrink-0 leading-none">→</span>
                <span>11 grupos de WhatsApp para cobrar 11 cuotas. La tesorería persigue, las familias se quejan.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-nex/60 shrink-0 leading-none">→</span>
                <span>30% de cuotas atrasadas en promedio. Plata que el club no ve porque nadie la rastrea.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-serif text-2xl text-nex/60 shrink-0 leading-none">→</span>
                <span>Cero visibilidad en vivo. Para saber cuánto entró este mes hay que armar un informe a mano.</span>
              </li>
            </ul>
            <p className="mt-8 text-sm text-nex-muted italic max-w-xl">
              Cuando el club crece, las planillas se caen. NEXCLUB es lo que las reemplaza.
            </p>
          </div>
        </div>
      </section>
      </RevealOnScroll>

      {/* 4. Cómo funciona — 3 actos con screenshots */}
      <RevealOnScroll><ThreeActsSection /></RevealOnScroll>

      {/* 5. Demo del producto — slot Remotion */}
      <RevealOnScroll><HeroDemoSlot /></RevealOnScroll>

      {/* 6. Tabla comparativa — NEXCLUB vs Excel/ComET/ERP */}
      <RevealOnScroll><ComparisonTable /></RevealOnScroll>

      {/* 7. Prueba social — card grande Barrancas FC */}
      <RevealOnScroll><BarrancasProofCard /></RevealOnScroll>

      {/* 8. Para quién */}
      <RevealOnScroll>
      <section id="para-quien" className="bg-nex-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
                Para quién
              </p>
              <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-nex-ink leading-[1.05] tracking-tight">
                Pensado para <span className="italic text-nex">tu club</span>.
              </h2>
              <p className="mt-6 text-base sm:text-lg text-nex-muted leading-relaxed">
                Desde infantiles hasta Primera, desde clubes de barrio hasta
                instituciones con miles de socios. Si tu club mueve gente,
                cuotas y comunicación todas las semanas, NEXCLUB es para vos.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Clubes desde 80 hasta miles de socios",
                "Infantiles, juveniles, reserva y primera",
                "Tesorería que cobra cuotas mes a mes",
                "Dirigencia que quiere ver el club entero en una pantalla",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-nex-soft text-nex grid place-items-center shrink-0">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-sm sm:text-base text-nex-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      </RevealOnScroll>

      {/* 9. FAQ */}
      <RevealOnScroll><FaqAccordion /></RevealOnScroll>

      {/* 10. Equipo humano */}
      <RevealOnScroll><HumanTeamBlock /></RevealOnScroll>

      {/* 11. CTA FINAL */}
      <RevealOnScroll>
      <section id="contacto" className="bg-nex-ink text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="font-serif text-4xl sm:text-6xl tracking-tight leading-[1.05]">
            Profesionalizá <span className="italic text-nex-soft">tu club.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Mostranos cómo trabajás hoy y te armamos una demo con tu club ya cargado.
            Sin compromiso, sin tarjeta.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-nex hover:bg-nex-hover text-white gap-2 h-12 text-base px-8"
            >
              <a href={NEXCLUB_WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Agendá una demo <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
      </RevealOnScroll>

      <MarketingFooter />
    </main>
  );
}
