import type { Metadata } from "next";

/**
 * Layout aislado del área de marketing (landing NEXCLUB).
 *
 * Punto clave: dentro de este grupo SOLO se usan tokens `--nex-*` (esmeralda
 * fija de la marca NexClub). Aunque el RootLayout inyecta los `--club-*` con
 * los colores del club del request, la landing nunca los lee.
 */

const TITLE = "NEXCLUB · El sistema operativo de tu club de fútbol formativo";
const DESCRIPTION =
  "Plataforma SaaS argentina para clubes de fútbol formativo. Padrón por categorías, cuotas con MercadoPago, portal para familias y comunicación, en una sola plataforma con la cara de tu club.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "gestión de club de fútbol",
    "software para club de fútbol formativo",
    "sistema de cuotas con MercadoPago",
    "padrón de jugadores Argentina",
    "club de fútbol inferiores",
    "comunicación con familias del club",
    "NEXCLUB",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "es_AR",
    siteName: "NEXCLUB",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://nexclub.app/#organization",
      name: "NEXCLUB",
      url: "https://nexclub.app",
      slogan: "El sistema operativo de tu club",
      areaServed: { "@type": "Country", name: "Argentina" },
      sameAs: [],
    },
    {
      "@type": "SoftwareApplication",
      name: "NEXCLUB",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: DESCRIPTION,
      offers: { "@type": "Offer", priceCurrency: "ARS", price: "0", description: "Demo gratuita sin tarjeta" },
      audience: {
        "@type": "Audience",
        audienceType: "Clubes de fútbol formativo argentinos",
      },
    },
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-nex-bg text-nex-ink min-h-dvh">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      {children}
    </div>
  );
}
