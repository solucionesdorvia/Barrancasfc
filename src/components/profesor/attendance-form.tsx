"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initials, formatDate } from "@/lib/utils";
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
  const [marks, setMarks] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const p of players) m[p.id] = initial[p.id] ?? true;
    return m;
  });
  const [saving, setSaving] = useState(false);

  function toggle(id: string, value: boolean) {
    setMarks((m) => ({ ...m, [id]: value }));
  }

  async function save() {
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
      toast.error("Error al guardar asistencia");
      return;
    }
    toast.success("Asistencia guardada");
    router.refresh();
  }

  const presentCount = Object.values(marks).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Fecha</p>
            <p className="font-semibold">{formatDate(date)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Presentes</p>
            <p className="font-semibold">{presentCount} / {players.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {players.map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={p.photo ?? undefined} />
                <AvatarFallback>{initials(`${p.firstName} ${p.lastName}`)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.firstName} {p.lastName}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggle(p.id, true)}
                  className={cn(
                    "h-9 w-9 rounded-md flex items-center justify-center transition-colors",
                    marks[p.id]
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-emerald-100"
                  )}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toggle(p.id, false)}
                  className={cn(
                    "h-9 w-9 rounded-md flex items-center justify-center transition-colors",
                    !marks[p.id]
                      ? "bg-red-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-red-100"
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="sticky bottom-4">
        <Button onClick={save} disabled={saving} className="w-full gap-2 h-12 shadow-lg">
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar asistencia"}
        </Button>
      </div>
    </div>
  );
}
