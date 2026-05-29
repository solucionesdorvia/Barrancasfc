"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const [revoking, setRevoking] = useState(false);

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
    if (!confirm("¿Revocar esta invitación? El link va a dejar de funcionar.")) return;
    setRevoking(true);
    const res = await fetch(`/api/invitations/${invitationId}`, { method: "DELETE" });
    setRevoking(false);
    if (!res.ok) return toast.error("No se pudo revocar");
    toast.success("Invitación revocada");
    router.refresh();
  }

  return (
    <div className="flex gap-1 justify-end">
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copy} title="Copiar link">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={revoke} disabled={revoking} title="Revocar">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
