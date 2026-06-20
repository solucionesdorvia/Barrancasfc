import type { Metadata } from "next";
import Link from "next/link";
import { NexClubWordmark } from "@/components/nex/wordmark";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-nex-bg text-nex-ink min-h-dvh">
      <header className="sticky top-0 z-30 backdrop-blur bg-nex-bg/85 border-b border-nex-border/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <NexClubWordmark size="md" />
          </Link>
          <nav className="flex items-center gap-4 text-sm text-nex-muted">
            <Link href="/legal/terms" className="hover:text-nex-ink">Términos</Link>
            <Link href="/legal/privacy" className="hover:text-nex-ink">Privacidad</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/*
          Styling manual del contenido legal en lugar de @tailwindcss/typography
          (evita una dependencia extra). Reglas en globals.css o aplicadas via
          classes directas en los hijos. Acá usamos un wrapper con typography
          clásica argentina (serif headings, sans body).
        */}
        <div className="text-nex-ink/85 leading-relaxed space-y-4 [&_h1]:font-serif [&_h1]:text-5xl [&_h1]:text-nex-ink [&_h1]:tracking-tight [&_h1]:leading-[1.05] [&_h1]:mb-4 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-nex-ink [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:text-nex-ink [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_li_strong]:text-nex-ink [&_a]:text-nex [&_a]:underline-offset-2 hover:[&_a]:underline [&_code]:bg-nex-soft/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.9em]">
          {children}
        </div>
        <div className="mt-16 pt-8 border-t border-nex-border flex items-center justify-between text-xs text-nex-muted">
          <Link href="/" className="hover:text-nex-ink">← Volver al inicio</Link>
          <span>NEXCLUB · Buenos Aires</span>
        </div>
      </main>
    </div>
  );
}
