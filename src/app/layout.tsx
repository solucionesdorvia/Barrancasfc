import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://barrancas-fc.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Barrancas FC — Gestión integral del club",
    template: "%s · Barrancas FC",
  },
  description:
    "Plataforma de gestión integral del club: jugadores, cobranza, asistencia, comunicación con padres, calendario y reportes.",
  keywords: ["Barrancas FC", "gestión de club", "fútbol", "jugadores", "cobranza", "asistencia"],
  applicationName: "Barrancas FC",
  authors: [{ name: "Dorvia" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: APP_URL,
    siteName: "Barrancas FC",
    title: "Barrancas FC — Gestión integral del club",
    description:
      "Una sola plataforma para jugadores, cobranza y comunicación con padres. Todo en un lugar, accesible desde el celu.",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Barrancas FC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Barrancas FC — Gestión integral del club",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Toaster position="top-right" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
