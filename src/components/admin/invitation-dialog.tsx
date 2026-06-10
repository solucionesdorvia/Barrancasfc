"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Send, Loader2, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Category = { id: string; name: string };
type Player = { id: string; firstName: string; lastName: string; category: { name: string } };

type Role = "ADMIN" | "PROFESOR" | "PADRE";

export function InvitationDialog({ categories, players }: { categories: Category[]; players: Player[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ url: string; expiresAt: string } | null>(null);

  const [role, setRole] = useState<Role>("PROFESOR");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [childrenIds, setChildrenIds] = useState<Set<string>>(new Set());
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [search, setSearch] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!search) return players;
    const q = search.toLowerCase();
    return players.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q)
    );
  }, [players, search]);

  function reset() {
    setRole("PROFESOR");
    setEmail("");
    setTitle("");
    setCategoryIds(new Set());
    setChildrenIds(new Set());
    setExpiresInDays("7");
    setSearch("");
    setCreated(null);
  }

  function toggleCategory(id: string) {
    setCategoryIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleChild(id: string) {
    setChildrenIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (role === "PROFESOR" && categoryIds.size === 0) {
      toast.error("Asigná al menos una categoría al profesor");
      return;
    }
    if (role === "PADRE" && childrenIds.size === 0) {
      toast.error("Asigná al menos un jugador al padre");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        email: email || undefined,
        title: title || undefined,
        categoryIds: Array.from(categoryIds),
        childrenIds: Array.from(childrenIds),
        expiresInDays: Number(expiresInDays),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo crear la invitación");
      return;
    }
    const data = await res.json();
    setCreated({ url: data.url, expiresAt: data.expiresAt });
    toast.success("Invitación creada");
    startTransition(() => router.refresh());
  }

  function whatsappMessage(url: string) {
    const roleLabel = role === "PROFESOR" ? "profesor" : role === "ADMIN" ? "administrador" : "padre";
    const ctx =
      role === "PROFESOR"
        ? ` a cargo de ${categories.filter((c) => categoryIds.has(c.id)).map((c) => c.name).join(", ")}`
        : role === "PADRE"
        ? ` para ver a ${players.filter((p) => childrenIds.has(p.id)).map((p) => p.firstName).join(", ")}`
        : "";
    return encodeURIComponent(
      `¡Hola! Te invitamos a sumarte a *Barrancas FC* como ${roleLabel}${ctx}.\n\nIngresá a este link para crear tu cuenta:\n${url}\n\nEl link es personal y expira pronto.`
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Send className="h-4 w-4" /> Nueva invitación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Invitar a un nuevo usuario</DialogTitle>
              <DialogDescription>
                Generá un link de invitación con el rol y los permisos preasignados.
                Le pasás el link por WhatsApp o mail y la persona crea su cuenta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="role">Rol *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="PROFESOR">Profesor / DT</SelectItem>
                      <SelectItem value="PADRE">Padre / tutor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expires">Expira en</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger id="expires"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 día</SelectItem>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input id="email" type="email" inputMode="email" autoComplete="off" placeholder="se@usa.como.referencia" value={email} onChange={(e) => setEmail(e.target.value)} />
                <p className="text-xs text-muted-foreground">Es solo para identificar la invitación. La persona usa su propio email al registrarse.</p>
              </div>

              {(role === "PROFESOR" || role === "ADMIN") && (
                <div className="space-y-1.5">
                  <Label htmlFor="title">Cargo (opcional)</Label>
                  <Input id="title" placeholder="Ej: DT, Coordinador, Preparador físico" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              )}

              {role === "PROFESOR" && (
                <div className="space-y-1.5">
                  <Label>Categorías a cargo *</Label>
                  <div className="border rounded-md max-h-44 overflow-y-auto divide-y">
                    {categories.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/50">
                        <Checkbox checked={categoryIds.has(c.id)} onCheckedChange={() => toggleCategory(c.id)} />
                        <span className="text-sm">{c.name}</span>
                      </label>
                    ))}
                  </div>
                  {categoryIds.size > 0 && (
                    <p className="text-xs text-muted-foreground">{categoryIds.size} categoría{categoryIds.size === 1 ? "" : "s"} seleccionada{categoryIds.size === 1 ? "" : "s"}</p>
                  )}
                </div>
              )}

              {role === "PADRE" && (
                <div className="space-y-1.5">
                  <Label>Hijos a vincular *</Label>
                  <Input placeholder="Buscar jugador…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm" />
                  <div className="border rounded-md max-h-44 overflow-y-auto divide-y">
                    {filteredPlayers.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Sin jugadores que coincidan</p>
                    ) : (
                      filteredPlayers.map((p) => (
                        <label key={p.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50">
                          <Checkbox checked={childrenIds.has(p.id)} onCheckedChange={() => toggleChild(p.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{p.lastName}, {p.firstName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.category.name}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {childrenIds.size > 0 && (
                    <p className="text-xs text-muted-foreground">{childrenIds.size} jugador{childrenIds.size === 1 ? "" : "es"} seleccionado{childrenIds.size === 1 ? "" : "s"}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear invitación
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" /> Invitación creada
              </DialogTitle>
              <DialogDescription>
                Copiá el link y mandáselo al usuario. Expira el{" "}
                {new Date(created.expiresAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}.
              </DialogDescription>
            </DialogHeader>
            <CreatedLinkBox url={created.url} waMessage={whatsappMessage(created.url)} />
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>Crear otra</Button>
              <Button onClick={() => { setOpen(false); reset(); }}>Listo</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedLinkBox({ url, waMessage }: { url: string; waMessage: string }) {
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);
  const fullMessage = decodeURIComponent(waMessage);

  async function copyText(text: string, kind: "link" | "msg") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
      toast.success(kind === "link" ? "Link copiado" : "Mensaje completo copiado");
    } catch {
      toast.error("No se pudo copiar. Copialo manualmente.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 px-3 py-2 text-xs font-mono rounded-md border bg-muted/50 select-all"
        />
        <Button size="icon" variant="outline" onClick={() => copyText(url, "link")} title="Copiar solo el link">
          {copied === "link" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {/* Preview del mensaje completo + botón para copiarlo */}
      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mensaje listo para pegar</p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => copyText(fullMessage, "msg")}
          >
            {copied === "msg" ? (
              <><Check className="h-3 w-3 text-emerald-600" /> Copiado</>
            ) : (
              <><Copy className="h-3 w-3" /> Copiar mensaje</>
            )}
          </Button>
        </div>
        <p className="text-xs whitespace-pre-line text-muted-foreground">{fullMessage}</p>
      </div>

      <a
        href={`https://wa.me/?text=${waMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
      >
        <ExternalLink className="h-4 w-4" /> Compartir por WhatsApp
      </a>

      <Badge variant="outline" className="text-[10px]">El link funciona una sola vez</Badge>
    </div>
  );
}
