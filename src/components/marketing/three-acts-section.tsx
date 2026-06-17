import { ScreenshotFrame } from "@/components/marketing/screenshot-frame";

/**
 * "Cómo funciona" narrativo en 3 actos, layout alterno (izq/der/izq).
 * Reemplaza la grilla de FeatureCards de la v1, que se sentía template.
 *
 * Cada acto = una fila de 2 columnas en desktop (texto + screenshot real),
 * stack en mobile. Cuando lleguen los screenshots reales se pasan via
 * `screenshotSrc` y el placeholder desaparece automáticamente.
 */
export function ThreeActsSection() {
  const acts: Act[] = [
    {
      number: "01",
      title: "Cargás tu club",
      body:
        "Importás el padrón desde Excel o COMET, armás las categorías y le ponés la cara del club. En una tarde queda andando — sin formularios infinitos, sin onboarding de tres semanas.",
      bullets: ["Padrón unificado", "Multi-categoría por jugador", "Tu logo y tus colores en todas las pantallas"],
      screenshotLabel: "Padrón con categorías · admin",
      reverse: false,
    },
    {
      number: "02",
      title: "Las familias pagan online",
      body:
        "Cada familia entra desde el celular, ve sus cuotas, paga con MercadoPago y recibe los avisos. La tesorería deja de perseguir por WhatsApp grupal y vos dejás de hacer planillas a las 11 de la noche.",
      bullets: ["Cobranza con MercadoPago", "Recordatorios automáticos", "Estado de cuenta por familia"],
      screenshotLabel: "Estado de cuenta · padre",
      reverse: true,
    },
    {
      number: "03",
      title: "Vos ves todo en tiempo real",
      body:
        "Cuánto entró este mes, qué categorías están al día, quién falta a entrenar. Sin reportes que armar a mano. Los números del club están a un click — y los podés exportar cuando quieras.",
      bullets: ["KPIs en vivo", "Asistencia con foto y geo", "Auditoría de todo lo que pasa"],
      screenshotLabel: "Dashboard del club · admin",
      reverse: false,
    },
  ];

  return (
    <section id="producto" className="bg-nex-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            Cómo funciona
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-nex-ink leading-[1.05] tracking-tight">
            Un sistema, <span className="italic text-nex">todo el club.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-nex-muted leading-relaxed">
            Gestión deportiva, administrativa y comunicación con las familias en
            una sola plataforma. Con la cara de tu club.
          </p>
        </div>
        <div className="mt-16 space-y-20 sm:space-y-28">
          {acts.map((act) => (
            <ActRow key={act.number} act={act} />
          ))}
        </div>
      </div>
    </section>
  );
}

type Act = {
  number: string;
  title: string;
  body: string;
  bullets: string[];
  screenshotLabel: string;
  screenshotSrc?: string;
  reverse: boolean;
};

function ActRow({ act }: { act: Act }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
      <div className={act.reverse ? "md:order-2" : ""}>
        <span className="font-serif italic text-5xl text-nex/40">{act.number}</span>
        <h3 className="mt-2 font-serif text-3xl sm:text-4xl text-nex-ink leading-tight">
          {act.title}
        </h3>
        <p className="mt-4 text-base text-nex-muted leading-relaxed">{act.body}</p>
        <ul className="mt-5 space-y-2">
          {act.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-nex-ink">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-nex shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={act.reverse ? "md:order-1" : ""}>
        <ScreenshotFrame label={act.screenshotLabel} src={act.screenshotSrc} ratio="video" />
      </div>
    </div>
  );
}
