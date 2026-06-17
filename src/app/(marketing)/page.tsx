import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Users,
  Wallet,
  MessageCircle,
  Sparkles,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { prisma } from "@/lib/prisma";
import { NEXCLUB_WHATSAPP_DEMO_URL } from "@/lib/constants";

const WHATSAPP_DEMO = NEXCLUB_WHATSAPP_DEMO_URL;

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

  // Sin subdomain: estamos en `nexclub.app/` (o legacy URL). Servimos la
  // landing pública. El header lee el estado de auth internamente.

  return (
    <main>
      <MarketingHeader />

      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-nex-soft blur-3xl opacity-60" />
          <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-nex-soft blur-3xl opacity-50" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-nex-border bg-white/80 px-3 py-1 text-xs font-medium text-nex-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-nex animate-pulse" />
            El sistema operativo de tu club
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-nex-ink leading-[1.05]">
            Todo tu club,<br />
            <span className="text-nex">en un solo lugar.</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-nex-muted leading-relaxed">
            NEXCLUB ordena las categorías, las cuotas y la comunicación con las familias.
            Dejá el Excel y gestioná tu club como la institución que es.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-nex hover:bg-nex-hover text-white gap-2 shadow-lg shadow-nex/20 h-12 text-base px-6"
            >
              <a href={WHATSAPP_DEMO} target="_blank" rel="noopener noreferrer">
                Agendá una demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-nex-border bg-white hover:bg-nex-soft text-nex-ink h-12 text-base px-6"
            >
              <a href="#features">Ver cómo funciona</a>
            </Button>
          </div>

          {/* Confianza visual: chips de "qué hace" */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs text-nex-muted">
            <Pill>Padrón unificado</Pill>
            <Pill>Cobranza con MercadoPago</Pill>
            <Pill>Portal para familias</Pill>
            <Pill>Asistencia y planteles</Pill>
          </div>
        </div>
      </section>

      {/* 2. EL PROBLEMA */}
      <section className="bg-white border-y border-nex-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            El problema
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-nex-ink">
            El Excel ya no te alcanza
          </h2>
          <p className="mt-6 text-base sm:text-lg text-nex-muted leading-relaxed max-w-3xl">
            Cientos de chicos en una decena de categorías. Cuotas que se persiguen por WhatsApp.
            Plata que no se sabe bien dónde está. Familias que no se enteran de nada.
            <strong className="text-nex-ink"> Cuando el club crece, las planillas se caen.</strong>
          </p>
        </div>
      </section>

      {/* 3. SOLUCIÓN */}
      <section className="relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-24 text-center">
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            La solución
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-nex-ink">
            Un sistema, todo el club
          </h2>
          <p className="mt-6 text-base sm:text-lg text-nex-muted leading-relaxed">
            NEXCLUB reúne la gestión deportiva, la administrativa y la comunicación con las
            familias en una sola plataforma, <strong className="text-nex-ink">con la cara de tu club</strong>.
          </p>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section id="features" className="bg-nex-soft/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
              Producto
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-nex-ink">
              Lo que NEXCLUB hace por tu club
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={Users}
              title="Padrón por categorías"
              body="Todas tus divisiones y jugadores ordenados: altas, fichas y categorías en un solo lugar."
            />
            <FeatureCard
              icon={Wallet}
              title="Cuotas y finanzas"
              body="Cobrá las cuotas con MercadoPago, seguí a los morosos y mirá las finanzas del club en tiempo real."
            />
            <FeatureCard
              icon={MessageCircle}
              title="Portal de familias"
              body="Cada familia ve su estado de cuenta, paga online y recibe las novedades del club."
            />
          </div>
          <p className="mt-8 text-center text-xs text-nex-muted">
            <Sparkles className="inline h-3 w-3 mr-1 text-nex-accent" />
            Próximamente: control médico, asistencia y más.
          </p>
        </div>
      </section>

      {/* 5. PRUEBA SOCIAL */}
      <section className="bg-white border-y border-nex-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1 text-center md:text-left">
              <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
                Confían en NEXCLUB
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-nex-ink">
                Ya lo usa Barrancas FC
              </h2>
            </div>
            <div className="md:col-span-2">
              <blockquote className="relative pl-6 border-l-4 border-nex">
                <p className="text-base sm:text-lg text-nex-ink leading-relaxed italic">
                  &ldquo;Pasamos de perseguir cuotas por WhatsApp a tener el club entero
                  ordenado en una sola pantalla. Las familias pagan online, los profes
                  ven su categoría, y nosotros vemos todo.&rdquo;
                </p>
                <footer className="mt-4 text-sm text-nex-muted">
                  — Dirigencia, Barrancas FC
                </footer>
              </blockquote>
              {/* Espacio para futuros clubes */}
              <p className="mt-6 text-xs text-nex-muted">
                <Sparkles className="inline h-3 w-3 mr-1 text-nex-accent" />
                Sumate y aparecé acá con tu club.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PARA QUIÉN */}
      <section id="para-quien" className="bg-nex-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
                Para quién
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-nex-ink">
                Pensado para tu club
              </h2>
              <p className="mt-6 text-base sm:text-lg text-nex-muted leading-relaxed">
                Ideal para clubes de fútbol formativo y de inferiores. Listo para escalar
                a cualquier club, de la liga de barrio a Primera División.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Clubes con 50 a 500 jugadores activos",
                "Categorías por edad o división",
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

      {/* 7. CTA FINAL */}
      <section id="contacto" className="bg-nex-ink text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Profesionalizá tu club
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
            Mostranos cómo trabajás hoy y te armamos una demo con tu club cargado.
            Sin compromiso, sin tarjeta.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-nex hover:bg-nex-hover text-white gap-2 h-12 text-base px-8"
            >
              <a href={WHATSAPP_DEMO} target="_blank" rel="noopener noreferrer">
                Agendá una demo <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-nex-border bg-white/80 text-nex-muted text-xs font-medium">
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-nex-border p-6 hover:shadow-lg hover:shadow-nex/5 transition-shadow">
      <div className="h-10 w-10 rounded-lg bg-nex-soft text-nex grid place-items-center mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-nex-ink">{title}</h3>
      <p className="mt-2 text-sm text-nex-muted leading-relaxed">{body}</p>
    </div>
  );
}
