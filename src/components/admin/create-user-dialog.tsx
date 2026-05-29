"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Eye, EyeOff, Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function CreateUserDialog({ categories, players }: { categories: Category[]; players: Player[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState<{ email: string; password: string } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PROFESOR");
  const [title, setTitle] = useState("");
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [childrenIds, setChildrenIds] = useState<Set<string>>(new Set());
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
    setFirstName(""); setLastName(""); setEmail(""); setPassword("");
    setRole("PROFESOR"); setTitle(""); setCategoryIds(new Set()); setChildrenIds(new Set());
    setSearch(""); setDone(null); setShowPass(false);
  }

  function toggleCat(id: string) {
    setCategoryIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleChild(id: string) {
    setChildrenIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      toast.error("Completá nombre, apellido, email y contraseña");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (role === "PROFESOR" && categoryIds.size === 0) {
      toast.error("Asigná al menos una categoría al profesor");
      return;
    }
    if (role === "PADRE" && childrenIds.size === 0) {
      toast.error("Asigná al menos un jugador al padre");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName, lastName, email, password, role,
        title: title || undefined,
        categoryIds: Array.from(categoryIds),
        childrenIds: Array.from(childrenIds),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "No se pudo crear la cuenta");
      return;
    }
    setDone({ email, password });
    toast.success("Cuenta creada");
    router.refresh();
  }

  async function copyAll() {
    if (!done) return;
    const text = `Email: ${done.email}\nContraseña: ${done.password}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Credenciales copiadas");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" /> Crear cuenta directa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {!done ? (
          <>
            <DialogHeader>
              <DialogTitle>Crear cuenta directa</DialogTitle>
              <DialogDescription>
                La persona puede entrar al instante con estas credenciales. Después puede cambiar la contraseña desde su perfil.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fn">Nombre *</Label>
                  <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={60} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ln">Apellido *</Label>
                  <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={60} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="em">Email *</Label>
                <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pw">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="pw"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Mostrar/ocultar"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">El usuario puede cambiarla desde su perfil después.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rl">Rol *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger id="rl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="PROFESOR">Profesor / DT</SelectItem>
                      <SelectItem value="PADRE">Padre / tutor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(role === "PROFESOR" || role === "ADMIN") && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ti">Cargo</Label>
                    <Input id="ti" placeholder="Ej: DT, Coordinador" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
                  </div>
                )}
              </div>

              {role === "PROFESOR" && (
                <div className="space-y-1.5">
                  <Label>Categorías a cargo *</Label>
                  <div className="border rounded-md max-h-40 overflow-y-auto divide-y">
                    {categories.map((c) => (
                      <label key={c.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50">
                        <Checkbox checked={categoryIds.has(c.id)} onCheckedChange={() => toggleCat(c.id)} />
                        <span className="text-sm">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {role === "PADRE" && (
                <div className="space-y-1.5">
                  <Label>Hijos a vincular *</Label>
                  <Input placeholder="Buscar jugador…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm" />
                  <div className="border rounded-md max-h-40 overflow-y-auto divide-y">
                    {filteredPlayers.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/50">
                        <Checkbox checked={childrenIds.has(p.id)} onCheckedChange={() => toggleChild(p.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{p.lastName}, {p.firstName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{p.category.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Cuenta creada
              </DialogTitle>
              <DialogDescription>
                Pasale estas credenciales a la persona. Puede cambiar la contraseña cuando entre.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 bg-zinc-50 border rounded-lg p-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                <p className="text-sm font-mono select-all break-all">{done.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contraseña</p>
                <p className="text-sm font-mono select-all break-all">{done.password}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={copyAll} className="gap-2">
                <Check className="h-4 w-4" /> Copiar credenciales
              </Button>
              <Button onClick={() => { setOpen(false); reset(); }}>Listo</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
