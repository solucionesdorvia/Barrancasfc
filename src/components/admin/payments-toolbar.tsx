"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

type Category = { id: string; name: string };

/**
 * Toolbar de filtros para /admin/payments.
 * - Búsqueda por nombre del jugador (debounce 300ms).
 * - Select de categoría (división).
 * Persiste filtros como ?q=&cat= y conserva el resto de los params
 * (m, y, filter) que la página padre usa para periodo y bucket.
 */
export function PaymentsToolbar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const cat = searchParams.get("cat") ?? "all";

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      startTransition(() => router.replace(`${pathname}?${params.toString()}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setCat(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v && v !== "all") params.set("cat", v);
    else params.delete("cat");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function clear() {
    setQ("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("cat");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const hasFilters = q || cat !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar jugador…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Select value={cat} onValueChange={setCat}>
        <SelectTrigger className="h-9 w-full sm:w-[180px]">
          <SelectValue placeholder="División" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las divisiones</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <button
          onClick={clear}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
        >
          <X className="h-3.5 w-3.5" /> Limpiar
        </button>
      )}
    </div>
  );
}
