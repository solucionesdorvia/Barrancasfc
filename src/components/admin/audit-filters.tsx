"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUDIT_ACTION_LABEL, type AuditAction } from "@/lib/audit";

type StaffUser = { id: string; name: string; role: string };

export function AuditFilters({ users }: { users: StaffUser[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const userId = sp.get("userId") ?? "all";
  const action = sp.get("action") ?? "all";
  const range = sp.get("range") ?? "30";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    startTransition(() => router.replace(`/admin/audit?${params.toString()}`));
  }

  const hasFilters = userId !== "all" || action !== "all" || range !== "30";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={userId} onValueChange={(v) => setParam("userId", v)}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Usuario" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los usuarios</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name} <span className="text-muted-foreground">· {u.role.toLowerCase()}</span></SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={action} onValueChange={(v) => setParam("action", v)}>
        <SelectTrigger className="w-[220px]"><SelectValue placeholder="Tipo de acción" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las acciones</SelectItem>
          {(Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]).map((a) => (
            <SelectItem key={a} value={a}>{AUDIT_ACTION_LABEL[a]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={range} onValueChange={(v) => setParam("range", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Últimos 7 días</SelectItem>
          <SelectItem value="30">Últimos 30 días</SelectItem>
          <SelectItem value="90">Últimos 90 días</SelectItem>
          <SelectItem value="all">Todo</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <button
          onClick={() => startTransition(() => router.replace("/admin/audit"))}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <X className="h-4 w-4" /> Limpiar
        </button>
      )}
    </div>
  );
}
