"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";

export function InvitationActions({
  invitationId,
  token,
  baseUrl,
}: {
  invitationId: string;
  token: string;
  baseUrl: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const url = `${baseUrl}/invite/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  async function revoke() {
    const res = await fetch(`/api/invitations/${invitationId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("No se pudo revocar");
      return;
    }
    toast.success("Invitación revocada");
    router.refresh();
  }

  return (
    <div className="flex gap-1 justify-end">
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9"
        onClick={copy}
        aria-label="Copiar link de invitación"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </Button>
      <ConfirmDialog
        trigger={
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-muted-foreground hover:text-red-600"
            aria-label="Revocar invitación"
          >
            <X className="h-4 w-4" />
          </Button>
        }
        title="¿Revocar esta invitación?"
        description="El link va a dejar de funcionar. Si la persona ya creó su cuenta no se afecta."
        destructive
        confirmLabel="Sí, revocar"
        onConfirm={revoke}
      />
    </div>
  );
}
