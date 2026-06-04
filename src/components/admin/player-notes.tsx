"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Trash2, Plus, Stethoscope, GraduationCap, ShieldAlert, Users as UsersIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  body: string;
  category: string | null;
  pinned: boolean;
  authorId: string;
  authorName?: string;
  createdAt: string | Date;
};

const CATEGORY_META: Record<string, { label: string; icon: typeof Stethoscope; tone: string }> = {
  medico: { label: "Médico", icon: Stethoscope, tone: "bg-red-100 text-red-700" },
  academico: { label: "Académico", icon: GraduationCap, tone: "bg-blue-100 text-blue-700" },
  disciplinario: { label: "Disciplinario", icon: ShieldAlert, tone: "bg-amber-100 text-amber-700" },
  familiar: { label: "Familiar", icon: UsersIcon, tone: "bg-purple-100 text-purple-700" },
  general: { label: "General", icon: FileText, tone: "bg-zinc-100 text-zinc-700" },
};

export function PlayerNotes({
  playerId,
  notes,
  currentUserId,
  isAdmin,
}: {
  playerId: string;
  notes: Note[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  async function add() {
    if (!body.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/players/${playerId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, category }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error("No se pudo guardar la nota");
      return;
    }
    toast.success("Nota guardada");
    setBody("");
    setCategory("general");
    router.refresh();
  }

  async function togglePin(note: Note) {
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    });
    if (!res.ok) return toast.error("No se pudo actualizar");
    router.refresh();
  }

  async function remove(note: Note) {
    if (!confirm("¿Eliminar esta nota? La acción no se puede deshacer.")) return;
    const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("No se pudo eliminar");
    toast.success("Nota eliminada");
    router.refresh();
  }

  const pinned = notes.filter((n) => n.pinned);
  const regular = notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Nueva nota</p>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Anotá lo que necesites recordar: problemas familiares, comportamiento, lesiones, situaciones académicas, etc."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{body.length}/2000</span>
            <Button size="sm" onClick={add} disabled={!body.trim() || submitting} className="gap-2">
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Agregar nota
            </Button>
          </div>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <EmptyState icon={FileText} title="Sin notas todavía" description="Las notas son privadas del staff. No las ven los padres ni los jugadores." />
      ) : (
        <div className="space-y-2">
          {pinned.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-wider text-muted-foreground px-1">Fijadas</p>
              {pinned.map((n) => (
                <NoteCard key={n.id} note={n} onTogglePin={togglePin} onDelete={remove} currentUserId={currentUserId} isAdmin={isAdmin} />
              ))}
            </>
          )}
          {regular.length > 0 && (
            <>
              {pinned.length > 0 && <p className="text-xs uppercase tracking-wider text-muted-foreground px-1 pt-2">Recientes</p>}
              {regular.map((n) => (
                <NoteCard key={n.id} note={n} onTogglePin={togglePin} onDelete={remove} currentUserId={currentUserId} isAdmin={isAdmin} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NoteCard({
  note,
  onTogglePin,
  onDelete,
  currentUserId,
  isAdmin,
}: {
  note: Note;
  onTogglePin: (n: Note) => void;
  onDelete: (n: Note) => void;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const meta = CATEGORY_META[note.category ?? "general"] ?? CATEGORY_META.general;
  const Icon = meta.icon;
  const canModify = note.authorId === currentUserId || isAdmin;

  return (
    <Card className={cn("transition-all", note.pinned && "border-amber-300 bg-amber-50/40")}>
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0", meta.tone)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] py-0">{meta.label}</Badge>
              {note.pinned && <Badge variant="warning" className="text-[10px] py-0">Fijada</Badge>}
              <span className="text-[10px] text-muted-foreground">{formatRelative(note.createdAt)}</span>
            </div>
            <p className="text-sm mt-1.5 whitespace-pre-line">{note.body}</p>
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px]">{initials(note.authorName ?? "?")}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">{note.authorName ?? "Staff"}</span>
            </div>
          </div>
          {canModify && (
            <div className="flex flex-col gap-1">
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => onTogglePin(note)} aria-label={note.pinned ? "Desfijar nota" : "Fijar nota"}>
                {note.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700" onClick={() => onDelete(note)} aria-label="Eliminar nota">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
