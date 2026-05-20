"use client";
import { useEffect, useState } from "react";
import { Send, MessageCircle, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatARS, monthName } from "@/lib/format";

export function WhatsappReminder({
  playerName,
  parentName,
  amount,
  month,
  year,
  daysOverdue,
}: {
  playerName: string;
  parentName: string;
  amount: number;
  month: number;
  year: number;
  daysOverdue: number;
}) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const baseMessage = `Hola ${parentName}! 👋\n\nTe escribimos desde *Barrancas FC* para recordarte que la cuota de ${playerName} correspondiente a *${monthName(month)} ${year}* (${formatARS(amount)}) figura como impaga${daysOverdue > 0 ? ` desde hace ${daysOverdue} ${daysOverdue === 1 ? "día" : "días"}` : ""}.\n\nPodés regularizarla por transferencia o Mercado Pago. Si ya hiciste el pago, mandanos el comprobante para actualizar el estado.\n\n¡Gracias!\n_Tesorería Barrancas FC_`;

  const [message, setMessage] = useState(baseMessage);

  useEffect(() => {
    if (open) setMessage(baseMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function reset() {
    setMessage(baseMessage);
  }

  function send() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setOpen(false);
      toast.success("Recordatorio enviado", {
        description: `${parentName} recibió el mensaje por WhatsApp.`,
      });
    }, 1200);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" /> Recordatorio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-600" /> Enviar recordatorio
          </DialogTitle>
          <DialogDescription>Editá el mensaje antes de enviarlo a {parentName}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              className="w-full bg-emerald-50 text-sm leading-relaxed p-3 rounded-xl border-0 focus:outline-none resize-none font-[inherit]"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Generado con los datos del jugador
            </span>
            <button onClick={reset} className="flex items-center gap-1 hover:text-foreground">
              <RotateCcw className="h-3 w-3" /> Restaurar
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={send} disabled={sending || message.trim().length === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4" />
            {sending ? "Enviando…" : "Enviar por WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
