import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://barrancas-fc.up.railway.app";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang="es" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
