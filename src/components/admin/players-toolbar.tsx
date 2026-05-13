"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Category = { id: string; name: string };

export function PlayersToolbar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const categoryId = searchParams.get("categoryId") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const overdue = searchParams.get("overdue") ?? "all";
  const scholarship = searchParams.get("scholarship") ?? "all";

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      startTransition(() => router.replace(`/admin/players?${params.toString()}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    startTransition(() => router.replace(`/admin/players?${params.toString()}`));
  }

  function clear() {
    setQ("");
    startTransition(() => router.replace("/admin/players"));
  }

  const hasFilters = q || categoryId !== "all" || status !== "all" || overdue !== "all" || scholarship !== "all";

  return (
    <div className="flex flex-col md:flex-row gap-2 md:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o DNI…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={categoryId} onValueChange={(v) => setParam("categoryId", v)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setParam("status", v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ACTIVE">Activos</SelectItem>
            <SelectItem value="INJURED">Lesionados</SelectItem>
            <SelectItem value="INACTIVE">Inactivos</SelectItem>
            <SelectItem value="SUSPENDED">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={overdue} onValueChange={(v) => setParam("overdue", v)}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Morosidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Solo morosos</SelectItem>
            <SelectItem value="no">Al día</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scholarship} onValueChange={(v) => setParam("scholarship", v)}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Becados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Becados</SelectItem>
            <SelectItem value="no">No becados</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-4 w-4" /> Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
