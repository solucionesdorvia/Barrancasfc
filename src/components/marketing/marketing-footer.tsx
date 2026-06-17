import { NexClubWordmark } from "@/components/nex/wordmark";
import { NEXCLUB_WHATSAPP_DEMO_URL, NEXCLUB_CONTACT_EMAIL } from "@/lib/constants";

/**
 * Footer institucional de la landing. 4 columnas en desktop, stack en mobile.
 * El wordmark va en variant="color" (NEX en ink, CLUB en primary) — es el
 * único lugar de la landing donde el wordmark se muestra a tamaño grande.
 */
export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-nex-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <NexClubWordmark size="lg" />
          <p className="mt-3 text-sm text-nex-muted leading-relaxed max-w-xs">
            El sistema operativo de tu club de fútbol formativo.
            Padrón, cuotas y comunicación con familias en un solo lugar.
          </p>
        </div>
        <FooterCol title="Producto">
          <FooterLink href="#producto">Cómo funciona</FooterLink>
          <FooterLink href="#comparativa">Vs. Excel y otros</FooterLink>
          <FooterLink href="#para-quien">Para quién es</FooterLink>
          <FooterLink href="#faq">Preguntas frecuentes</FooterLink>
        </FooterCol>
        <FooterCol title="Contacto">
          <FooterLink href={NEXCLUB_WHATSAPP_DEMO_URL} external>
            WhatsApp
          </FooterLink>
          <FooterLink href={`mailto:${NEXCLUB_CONTACT_EMAIL}`}>
            {NEXCLUB_CONTACT_EMAIL}
          </FooterLink>
        </FooterCol>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 pt-2 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between text-xs text-nex-muted">
        <span>© {new Date().getFullYear()} NEXCLUB · Todos los derechos reservados.</span>
        <span>Hecho en Buenos Aires, para clubes argentinos.</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="text-sm">
      <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold mb-3">
        {title}
      </p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-nex-ink/80 hover:text-nex transition-colors"
      >
        {children}
      </a>
    </li>
  );
}
