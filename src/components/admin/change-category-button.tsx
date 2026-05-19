"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = { id: string; name: string };

export function ChangeCategoryButton({
  playerId,
  currentCategoryId,
  categories,
}: {
  playerId: string;
  currentCategoryId: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(currentCategoryId);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (selected === currentCategoryId) {
      setOpen(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/players/${playerId}/change-category`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: selected }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Error al cambiar de categoría");
      return;
    }
    toast.success("Categoría actualizada");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Cambiar categoría
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar de categoría</DialogTitle>
          <DialogDescription>
            El cambio queda registrado en la auditoría con tu usuario y la fecha.
          </DialogDescription>
        </DialogHeader>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading || selected === currentCategoryId}>
            {loading ? "Guardando…" : "Confirmar cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
