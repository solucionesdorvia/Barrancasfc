import type { Metadata } from "next";

/**
 * Layout aislado del área de marketing (landing NEXCLUB).
 *
 * Punto clave: dentro de este grupo SOLO se usan tokens `--nex-*` (esmeralda
 * fija de la marca NexClub). Aunque el RootLayout inyecta los `--club-*` con
 * los colores del club del request, la landing nunca los lee.
 */

const TITLE = "NEXCLUB · Toda la gestión de tu club deportivo";
const DESCRIPTION =
  "Hecho en Argentina para clubes deportivos — fútbol, futsal, hockey, rugby, vóley y más. Padrón por categorías, cuotas con MercadoPago, portal para familias y comunicación, en un solo lugar con la cara de tu club.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "gestión de club deportivo",
    "software para club deportivo",
    "software para club de fútbol",
    "software para club de hockey",
    "software para club de rugby",
    "software para club de futsal",
    "software para club de vóley",
    "sistema de cuotas con MercadoPago",
    "padrón de socios",
    "club Primera División",
    "club de inferiores",
    "club amateur",
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
      slogan: "Toda la gestión de tu club",
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
        audienceType: "Clubes de deportivos argentinos",
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
