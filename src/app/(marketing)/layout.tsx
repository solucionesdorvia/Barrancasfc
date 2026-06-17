import type { Metadata } from "next";

/**
 * Layout aislado del área de marketing (landing NEXCLUB).
 *
 * Punto clave: dentro de este grupo SOLO se usan tokens `--nex-*` (esmeralda
 * fija de la marca NexClub). Aunque el RootLayout inyecta los `--club-*` con
 * los colores del club del request, la landing nunca los lee — usa clases
 * `bg-nex`, `text-nex-ink`, etc. Resultado: la marca NexClub siempre se ve
 * igual, sin importar qué club esté cargado abajo.
 */
export const metadata: Metadata = {
  title: "NEXCLUB · El sistema operativo de tu club",
  description:
    "Ordená tu club entero: padrón por categorías, cuotas y comunicación con las familias en una sola plataforma. Dejá el Excel atrás.",
  openGraph: {
    title: "NEXCLUB · El sistema operativo de tu club",
    description:
      "Padrón por categorías, cuotas con MercadoPago, portal de familias. Todo en un lugar, con la cara de tu club.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-nex-bg text-nex-ink min-h-dvh">
      {children}
    </div>
  );
}
