"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PollProps = {
  noticeId: string;
  options: string[];
  closesAt: Date | string | null;
  /** Index del voto del user actual (null si no votó) */
  myVote: number | null;
  /** Conteos por opción */
  counts: number[];
  /** Mostrar los resultados aunque no haya votado todavía */
  showResults?: boolean;
};

export function NoticePoll({ noticeId, options, closesAt, myVote, counts, showResults }: PollProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [voting, setVoting] = useState(false);
  const [selected, setSelected] = useState<number | null>(myVote);

  const totalVotes = counts.reduce((s, c) => s + c, 0);
  const closesAtDate = closesAt ? (typeof closesAt === "string" ? new Date(closesAt) : closesAt) : null;
  const isClosed = closesAtDate ? closesAtDate < new Date() : false;
  const showBars = isClosed || myVote !== null || showResults;

  async function vote(idx: number) {
    if (isClosed) return;
    setVoting(true);
    setSelected(idx);
    const res = await fetch(`/api/notices/${noticeId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIdx: idx }),
    });
    setVoting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo registrar el voto");
      setSelected(myVote);
      return;
    }
    toast.success(myVote !== null ? "Voto actualizado" : "Voto registrado");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-2 mt-3">
      {options.map((opt, idx) => {
        const count = counts[idx] ?? 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isMine = selected === idx;

        return (
          <button
            key={idx}
            onClick={() => vote(idx)}
            disabled={voting || isClosed}
            className={cn(
              "relative w-full text-left rounded-md border overflow-hidden transition-all",
              isMine ? "border-club bg-rose-50" : "border-input bg-background hover:bg-muted/50",
              isClosed && "cursor-default opacity-90"
            )}
          >
            {/* Barra de progreso (solo si se muestran resultados) */}
            {showBars && (
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-all",
                  isMine ? "bg-club/15" : "bg-zinc-200/60"
                )}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center gap-2 px-3 py-2.5">
              <div className={cn(
                "h-5 w-5 rounded-full border-2 grid place-items-center shrink-0",
                isMine ? "border-club bg-club text-white" : "border-zinc-300"
              )}>
                {isMine && <Check className="h-3 w-3" />}
              </div>
              <span className="text-sm flex-1 truncate">{opt}</span>
              {showBars && (
                <span className="text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                  {pct}% · {count}
                </span>
              )}
            </div>
          </button>
        );
      })}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3" />
          {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
        </span>
        {isClosed ? (
          <span>Votación cerrada</span>
        ) : closesAtDate ? (
          <span>Cierra el {closesAtDate.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
        ) : (
          <span>Abierta</span>
        )}
      </div>
    </div>
  );
}
