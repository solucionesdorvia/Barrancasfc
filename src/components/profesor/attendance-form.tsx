"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, X, Users, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initials, fullName, formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
};

export function AttendanceForm({
  players,
  date,
  initial,
  categoryId,
}: {
  players: Player[];
  date: Date;
  initial: Record<string, boolean | undefined>;
  categoryId: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [marks, setMarks] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const p of players) m[p.id] = initial[p.id] ?? true;
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function toggle(id: string, value: boolean) {
    setMarks((m) => ({ ...m, [id]: value }));
    setDirty(true);
  }

  function markAllPresent() {
    setMarks(Object.fromEntries(players.map((p) => [p.id, true])));
    setDirty(true);
  }

  async function save() {
    if (players.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: date.toISOString(),
        categoryId,
        marks: Object.entries(marks).map(([playerId, present]) => ({ playerId, present })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "No se pudo guardar la asistencia");
      return;
    }
    toast.success("Asistencia guardada");
    setDirty(false);
    startTransition(() => router.refresh());
  }

  const presentCount = Object.values(marks).filter(Boolean).length;
  const absentCount = players.length - presentCount;

  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay jugadores activos en esta categoría.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha del entrenamiento</p>
              <p className="font-semibold">{formatDateLong(date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Presentes</p>
              <p className="font-semibold tabular-nums">
                <span className="text-emerald-600">{presentCount}</span>
                <span className="text-muted-foreground"> / {players.length}</span>
                {absentCount > 0 && <span className="text-red-500 text-xs ml-2">({absentCount} ausentes)</span>}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllPresent}
            className="mt-3 -ml-2 text-xs text-muted-foreground gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todos presentes
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {players.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={p.photo ?? undefined} />
                <AvatarFallback>{initials(fullName(p.firstName, p.lastName))}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{p.lastName}, {p.firstName}</p>
              </div>
              <div className="flex gap-1" role="group" aria-label="Asistencia">
                <button
                  onClick={() => toggle(p.id, true)}
                  aria-pressed={marks[p.id]}
                  aria-label="Presente"
                  className={cn(
                    "h-10 w-10 rounded-md flex items-center justify-center transition-all",
                    marks[p.id]
                      ? "bg-emerald-500 text-white shadow-sm scale-105"
                      : "bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700"
                  )}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toggle(p.id, false)}
                  aria-pressed={!marks[p.id]}
                  aria-label="Ausente"
                  className={cn(
                    "h-10 w-10 rounded-md flex items-center justify-center transition-all",
                    !marks[p.id]
                      ? "bg-red-500 text-white shadow-sm scale-105"
                      : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700"
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="md:relative md:bottom-auto fixed bottom-0 inset-x-0 z-20 px-4 py-3 md:p-0 bg-background/95 backdrop-blur md:bg-transparent border-t md:border-0">
        <Button
          onClick={save}
          disabled={saving || !dirty}
          className="w-full gap-2 h-12 shadow-lg max-w-md md:max-w-none mx-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : dirty ? "Guardar asistencia" : "Asistencia al día"}
        </Button>
      </div>
    </div>
  );
}
