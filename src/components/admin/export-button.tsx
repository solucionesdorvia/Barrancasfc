"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Botón que descarga datos como CSV (Excel-friendly). Recibe una matriz y un
 * nombre de archivo. No depende de xlsx para evitar bundle bloat — CSV abre
 * con un doble click en Excel/Sheets igual.
 */
export function ExportButton({
  rows,
  filename,
  label = "Exportar a Excel",
}: {
  rows: (string | number | null | undefined)[][];
  filename: string;
  label?: string;
}) {
  function download() {
    const csv = rows
      .map((row) =>
        row
          .map((v) => {
            const s = v === null || v === undefined ? "" : String(v);
            // Escape para CSV: rodear con comillas si tiene coma, salto o comillas
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(",")
      )
      .join("\n");
    // BOM para que Excel detecte UTF-8 y muestre los acentos
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button size="sm" variant="outline" className="gap-2" onClick={download}>
      <Download className="h-4 w-4" /> {label}
    </Button>
  );
}
