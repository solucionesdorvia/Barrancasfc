import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { Toaster } from "sonner";
import { getCurrentClub, clubCssVars } from "@/lib/club";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Canonical base para metadata (OG image, Twitter cards, etc.). Hardcoded
// a www.nexclub.app — la env var NEXT_PUBLIC_APP_URL quedó obsoleta y
// estaba apuntando a localhost en prod, rompiendo los previews de OG.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
  ? process.env.NEXT_PUBLIC_APP_URL
  : "https://www.nexclub.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "NEXCLUB Barrancas — Gestión integral del club",
    template: "%s · NEXCLUB Barrancas",
  },
  description:
    "Plataforma NEXCLUB de gestión integral del club Barrancas FC: jugadores, cobranza, asistencia, comunicación con padres, calendario y reportes.",
  keywords: ["NEXCLUB", "Barrancas FC", "gestión de club", "fútbol", "jugadores", "cobranza", "asistencia"],
  applicationName: "NEXCLUB Barrancas",
  authors: [{ name: "Dorvia" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: APP_URL,
    siteName: "NEXCLUB Barrancas",
    title: "NEXCLUB Barrancas — Gestión integral del club",
    description:
      "Una sola plataforma para jugadores, cobranza y comunicación con padres. Todo en un lugar, accesible desde el celu.",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "NEXCLUB Barrancas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXCLUB Barrancas — Gestión integral del club",
    description: "Plataforma de gestión del club: jugadores, cobranza, asistencia.",
    images: ["/logo.png"],
  },
  // El MVP no debería indexarse hasta producción
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C8102E",
};

// Cast por mismatch de types entre @clerk/localizations v4 y @clerk/nextjs v5; en runtime funciona.
// Extendemos con overrides custom para keys que esES no cubre (mensajes de password,
// unstable_errors) y para personalizar el copy con el nombre del club.
/* eslint-disable @typescript-eslint/no-explicit-any */
const esBase = esES as any;
const clerkLocalization: any = {
  ...esBase,
  signUp: {
    ...esBase.signUp,
    start: {
      ...(esBase.signUp?.start ?? {}),
      title: "Creá tu cuenta",
      subtitle: "para entrar a NEXCLUB Barrancas",
    },
  },
  unstable__errors: {
    ...esBase.unstable__errors,
    passwords_helper_text: "La contraseña cumple con los requisitos.",
    zxcvbn: {
      ...(esBase.unstable__errors?.zxcvbn ?? {}),
      goodPassword: "La contraseña cumple con todos los requisitos.",
      notEnough: "La contraseña no es lo suficientemente fuerte.",
    },
  },
  formFieldHintText__password: "Usá al menos 8 caracteres.",
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolvemos el club del request (subdomain o fallback al único club que hay
  // hoy). Inyectamos sus colores como CSS vars en el <html> para que el resto
  // de la UI los consuma via `bg-club`, `text-club`, etc.
  const club = await getCurrentClub();
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html
        lang="es"
        suppressHydrationWarning
        data-club={club?.slug ?? "default"}
        style={clubCssVars(club)}
      >
        <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
