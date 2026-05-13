"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";

type Child = { id: string; firstName: string; lastName: string; photo: string | null };

export function ChildSwitcher({ items, activeId }: { items: Child[]; activeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (items.length <= 1) return null;

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("hijo", id);
    router.replace(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
      {items.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => select(c.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full border text-sm shrink-0 transition-all",
              active ? "bg-barrancas-red text-white border-barrancas-red" : "bg-background"
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={c.photo ?? undefined} />
              <AvatarFallback className={active ? "bg-white/20 text-white" : ""}>{initials(`${c.firstName} ${c.lastName}`)}</AvatarFallback>
            </Avatar>
            {c.firstName}
          </button>
        );
      })}
    </div>
  );
}
