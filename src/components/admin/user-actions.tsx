"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/alert-dialog";

type Props = {
  user: { id: string; name: string; title: string | null; role: string };
};

export function UserActions({ user }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title ?? "");
  const [loading, setLoading] = useState(false);

  async function saveEdit() {
    if (name.trim().length < 1) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), title: title.trim() || null }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo guardar");
      return;
    }
    toast.success("Usuario actualizado");
    setEditOpen(false);
    router.refresh();
  }

  async function remove() {
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo eliminar");
      return;
    }
    toast.success("Usuario eliminado");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            aria-label="Acciones del usuario"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => setEditOpen(true)} className="gap-2">
            <Pencil className="h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ConfirmDialog
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </DropdownMenuItem>
            }
            title={`¿Eliminar a ${user.name}?`}
            description="Se borra de la app y de Clerk. La actividad histórica queda en la auditoría. Si el usuario tiene categorías/hijos asignados, primero desvinculalos."
            destructive
            confirmLabel="Sí, eliminar"
            onConfirm={remove}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Cambiá el nombre o el cargo. Para reasignar categorías o hijos abrí el perfil.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Nombre completo</Label>
              <Input
                id="u-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-title">
                Cargo / título <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="u-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={user.role === "PROFESOR" ? "DT, Coordinador, etc." : user.role === "PADRE" ? "Padre, Madre, Tutor/a" : "Administrador"}
                maxLength={80}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={loading}>{loading ? "Guardando…" : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
