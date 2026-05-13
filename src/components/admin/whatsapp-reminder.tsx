"use client";
import { useState } from "react";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { formatARS, monthName } from "@/lib/utils";

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

  const message = `Hola ${parentName}! 👋\n\nTe escribimos desde *Barrancas FC* para recordarte que la cuota de ${playerName} correspondiente a *${monthName(month)} ${year}* (${formatARS(amount)}) figura como impaga${daysOverdue > 0 ? ` desde hace ${daysOverdue} días` : ""}.\n\nPodés regularizarla por transferencia o Mercado Pago. Si ya hiciste el pago, mandanos el comprobante para actualizar el estado.\n\n¡Gracias!\n_Tesorería Barrancas FC_`;

  function send() {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setOpen(false);
      toast.success("Recordatorio enviado por WhatsApp");
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
          <DialogDescription>Vista previa del mensaje a {parentName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-sm whitespace-pre-line leading-relaxed">{message}</p>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Mensaje generado automáticamente con datos del jugador
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={send} disabled={sending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4" />
            {sending ? "Enviando…" : "Enviar por WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
