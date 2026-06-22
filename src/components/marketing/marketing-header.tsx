import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { NexClubWordmark } from "@/components/nex/wordmark";

/**
 * Header sticky de la landing NEXCLUB. Lee el estado de auth para mostrar
 * "Ingresar" (anónimo) o "Ir al panel" (logueado).
 *
 * Se mantiene en marketing/ (no en nex/) porque el copy y los anchors son
 * específicos de la landing; el wordmark sí es reusable y se importa de nex/.
 */
export function MarketingHeader() {
  const { userId } = auth();
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-nex-bg/85 border-b border-nex-border/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <NexClubWordmark size="md" />
        </Link>
        <nav className="hidden sm:flex items-center gap-2 text-sm text-nex-muted">
          <a href="#producto" className="hover:text-nex-ink transition-colors inline-flex items-center min-h-[44px] px-2">Producto</a>
          <a href="#comparativa" className="hover:text-nex-ink transition-colors inline-flex items-center min-h-[44px] px-2">Por qué NEXCLUB</a>
          <a href="#para-quien" className="hover:text-nex-ink transition-colors inline-flex items-center min-h-[44px] px-2">Para quién</a>
          <a href="#faq" className="hover:text-nex-ink transition-colors inline-flex items-center min-h-[44px] px-2">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {userId ? (
            <Button asChild size="sm" className="bg-nex hover:bg-nex-hover text-white gap-1.5">
              <Link href="/admin">Ir al panel <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost" className="text-nex-ink hover:text-nex">
              <Link href="/sign-in">Ingresar</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
