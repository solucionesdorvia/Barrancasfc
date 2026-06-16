"use client";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  /** Fecha seleccionada (YYYY-MM-DD) */
  selectedDate: string;
  /** Fechas que tuvieron entrenamiento registrado (YYYY-MM-DD), ordenadas DESC */
  trainingDates: string[];
};

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function format(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Selector de día para el panel del profesor.
 *
 * - Muestra la fecha en formato amigable ("Martes 10 de junio").
 * - Botones ← anterior / siguiente → que saltan entre fechas que tuvieron
 *   entrenamiento (no días calendar genéricos).
 * - Botón "Hoy" para volver de un saque.
 * - Input date oculto para elegir cualquier día específico.
 * - Si la fecha elegida NO tuvo entrenamiento, banner sugiriendo la más
 *   cercana y un botón para ir directo.
 */
export function ProfesorDatePicker({ selectedDate, trainingDates }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);

  const todayIso = toIso(new Date());
  const selectedDateObj = useMemo(() => fromIso(selectedDate), [selectedDate]);
  const isToday = selectedDate === todayIso;
  const hasTraining = trainingDates.includes(selectedDate);

  // Vecinos en la lista de entrenamientos (orden DESC: index 0 = más reciente)
  const sortedAsc = useMemo(() => [...trainingDates].sort(), [trainingDates]);
  const prevTraining = useMemo(() => {
    return [...sortedAsc].reverse().find((d) => d < selectedDate);
  }, [sortedAsc, selectedDate]);
  const nextTraining = useMemo(() => {
    return sortedAsc.find((d) => d > selectedDate);
  }, [sortedAsc, selectedDate]);

  // Fecha más cercana (en cualquier dirección) si la actual no tiene entrenamiento
  const nearestTraining = useMemo(() => {
    if (hasTraining || sortedAsc.length === 0) return null;
    return sortedAsc.reduce((best, d) => {
      const diff = Math.abs(fromIso(d).getTime() - selectedDateObj.getTime());
      const bestDiff = Math.abs(fromIso(best).getTime() - selectedDateObj.getTime());
      return diff < bestDiff ? d : best;
    }, sortedAsc[0]);
  }, [hasTraining, sortedAsc, selectedDate, selectedDateObj]);

  function go(targetIso: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (targetIso === todayIso) params.delete("fecha");
    else params.set("fecha", targetIso);
    router.push(`${pathname}?${params.toString()}`);
  }

  function onPick(iso: string) {
    setPickerOpen(false);
    if (iso) go(iso);
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header con día grande + chip "hoy" */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3" />
              {isToday ? "Hoy" : "Día seleccionado"}
            </p>
            <p className="text-base sm:text-lg font-semibold capitalize leading-tight">
              {format(selectedDateObj)}
            </p>
          </div>
          {!isToday && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => go(todayIso)}
              className="shrink-0 text-xs h-7"
            >
              Volver a hoy
            </Button>
          )}
        </div>

        {/* Banner si la fecha no tuvo entrenamiento */}
        {!hasTraining && nearestTraining && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 text-xs text-amber-900">
              <p>
                No hubo entrenamiento este día. El más cercano fue el{" "}
                <span className="font-medium capitalize">{format(fromIso(nearestTraining))}</span>.
              </p>
              <button
                type="button"
                onClick={() => go(nearestTraining)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline"
              >
                Ir a esa fecha <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Navegación por entrenamientos */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!prevTraining}
            onClick={() => prevTraining && go(prevTraining)}
            className="flex-1 gap-1 h-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">Anterior</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPickerOpen(true)}
            className="flex-1 gap-1 h-8"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="text-xs">Elegir fecha</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!nextTraining}
            onClick={() => nextTraining && go(nextTraining)}
            className="flex-1 gap-1 h-8"
          >
            <span className="text-xs">Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Input date oculto que se dispara cuando "Elegir fecha" */}
        {pickerOpen && (
          <input
            type="date"
            autoFocus
            defaultValue={selectedDate}
            max={todayIso}
            onChange={(e) => onPick(e.target.value)}
            onBlur={() => setPickerOpen(false)}
            className="w-full text-sm border rounded-md px-2 py-2 bg-background"
          />
        )}

        <p className="text-[10px] text-muted-foreground">
          {trainingDates.length === 0
            ? "Todavía no se tomó asistencia en esta categoría."
            : `${trainingDates.length} entrenamiento${trainingDates.length === 1 ? "" : "s"} registrado${trainingDates.length === 1 ? "" : "s"} en los últimos 90 días.`}
        </p>
      </CardContent>
    </Card>
  );
}
