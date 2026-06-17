import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClubForm } from "@/components/super/club-form";

export default function NewClubPage() {
  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-nex-muted hover:text-nex-ink">
        <Link href="/super/clubs"><ArrowLeft className="h-4 w-4" /> Volver a clubes</Link>
      </Button>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">NEXCLUB</p>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo club</h1>
        <p className="text-sm text-nex-muted mt-1">
          Una vez creado, el club queda activo en <span className="font-mono">slug.nexclub.app</span>.
          Después generás la primera invitación admin desde la ficha del club.
        </p>
      </div>
      <ClubForm />
    </div>
  );
}
