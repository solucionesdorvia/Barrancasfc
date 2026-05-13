"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const REQUIRED_FIELDS = [
  { key: "firstName", label: "Nombre" },
  { key: "lastName", label: "Apellido" },
  { key: "dni", label: "DNI" },
  { key: "birthDate", label: "Fecha de nacimiento" },
  { key: "categoryName", label: "Categoría" },
];
const OPTIONAL_FIELDS = [
  { key: "address", label: "Domicilio" },
  { key: "healthInsurance", label: "Obra social" },
  { key: "healthInsuranceNumber", label: "Nº obra social" },
  { key: "emergencyContact", label: "Contacto emergencia" },
  { key: "schoolName", label: "Colegio" },
];
const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const HEURISTICS: Record<string, RegExp> = {
  firstName: /^(nombre|first.?name|nombres)$/i,
  lastName: /^(apellido|last.?name|apellidos)$/i,
  dni: /^(dni|documento|cuil|cuit)$/i,
  birthDate: /(nacim|birth|fecha.?nac)/i,
  categoryName: /(categor|division|division|division|category)/i,
  address: /(direcci|domicil|address)/i,
  healthInsurance: /(obra.?social|prepaga|health)/i,
  healthInsuranceNumber: /(n[ºo°]?.?obra|n[ºo°]?.?afiliado|insurance.?number)/i,
  emergencyContact: /(emergencia|contact|tel[eé]fono)/i,
  schoolName: /(colegio|escuela|school)/i,
};

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

export function ExcelImporter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; errors: { row: number; error: string }[] } | null>(null);

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setProgress(0);
    setResult(null);
  }

  async function handleFile(file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    if (json.length === 0) {
      toast.error("El archivo está vacío");
      return;
    }
    const hs = Object.keys(json[0]);
    const auto: Record<string, string> = {};
    for (const f of ALL_FIELDS) {
      const re = HEURISTICS[f.key];
      const match = hs.find((h) => re.test(h));
      if (match) auto[f.key] = match;
    }
    setHeaders(hs);
    setRows(json);
    setMapping(auto);
    setStep("mapping");
  }

  function nextToPreview() {
    const missing = REQUIRED_FIELDS.filter((f) => !mapping[f.key]);
    if (missing.length) {
      toast.error(`Faltan mapear: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setStep("preview");
  }

  async function handleImport() {
    setStep("importing");
    setProgress(10);

    const payload = rows.map((r) => {
      const obj: Record<string, unknown> = {};
      for (const f of ALL_FIELDS) {
        const col = mapping[f.key];
        if (col) obj[f.key] = r[col];
      }
      return obj;
    });

    setProgress(40);

    const res = await fetch("/api/players/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: payload }),
    });

    setProgress(80);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(`Error al importar: ${err.error ?? "Desconocido"}`);
      setStep("preview");
      return;
    }

    const data = await res.json();
    setResult(data);
    setProgress(100);
    setStep("done");
    toast.success(`${data.inserted} jugadores importados`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar jugadores desde Excel</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Subí el .xlsx con los datos del club. Detectamos las columnas automáticamente."}
            {step === "mapping" && "Verificá que las columnas estén bien mapeadas."}
            {step === "preview" && `${rows.length} jugadores listos para importar.`}
            {step === "importing" && "Importando…"}
            {step === "done" && "Importación finalizada."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm">Arrastrá el archivo o hacé click para elegir</span>
            <span className="text-xs text-muted-foreground">.xlsx, .xls, .csv</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        )}

        {step === "mapping" && (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
            {ALL_FIELDS.map((f) => {
              const required = REQUIRED_FIELDS.some((r) => r.key === f.key);
              return (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="text-sm w-44 flex items-center gap-1">
                    {f.label} {required && <span className="text-red-500">*</span>}
                  </span>
                  <Select
                    value={mapping[f.key] ?? "_none"}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === "_none" ? "" : v }))}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="No mapear" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— No mapear —</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}

        {step === "preview" && (
          <div className="border rounded-md max-h-[360px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {ALL_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 10).map((r, i) => (
                  <TableRow key={i}>
                    {ALL_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <TableCell key={f.key} className="text-xs">
                        {String(r[mapping[f.key]] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-4">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">Procesando {rows.length} registros…</p>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-medium">{result.inserted} jugadores importados</p>
                <p className="text-xs text-muted-foreground">Se cargaron correctamente en la base.</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{result.errors.length} filas con errores</p>
                  <ul className="mt-1 text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>Fila {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "mapping" && (
            <Button onClick={nextToPreview}>Continuar</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("mapping")}>Atrás</Button>
              <Button onClick={handleImport}>Importar {rows.length} jugadores</Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => { setOpen(false); reset(); }}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
