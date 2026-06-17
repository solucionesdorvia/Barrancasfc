import { Check, Minus } from "lucide-react";

/**
 * Tabla comparativa NEXCLUB vs alternativas. El bloque que más cierra la
 * venta — si todo es ✓ en NEXCLUB y ✗ en los demás, parece marketing.
 * Por eso reconocemos fortalezas de cada uno y dejamos al menos un — en
 * NEXCLUB ("fichajes AFA"), donde ComET sí gana.
 *
 * Desktop: tabla 5 columnas. Mobile: stacked cards por capability.
 */

type Capability = {
  feature: string;
  detail?: string;
  nex: Cell;
  excel: Cell;
  comet: Cell;
  erp: Cell;
};

type Cell = { kind: "yes" } | { kind: "no" } | { kind: "partial"; label: string };

const CAPS: Capability[] = [
  {
    feature: "Identidad propia del club",
    detail: "Tu logo, colores, dominio. Las familias entran a tu club, no a un genérico.",
    nex: { kind: "yes" },
    excel: { kind: "no" },
    comet: { kind: "no" },
    erp: { kind: "partial", label: "Limitado" },
  },
  {
    feature: "App para las familias",
    detail: "Estado de cuenta, pago online, avisos. Desde el celu, sin instalar nada.",
    nex: { kind: "yes" },
    excel: { kind: "no" },
    comet: { kind: "no" },
    erp: { kind: "partial", label: "Solo facturas" },
  },
  {
    feature: "Cobranza con MercadoPago",
    detail: "Link de pago por familia, conciliación automática, alerta a la tesorería.",
    nex: { kind: "yes" },
    excel: { kind: "no" },
    comet: { kind: "no" },
    erp: { kind: "yes" },
  },
  {
    feature: "Asistencia con foto y geo",
    detail: "El profe marca presentes desde la cancha. Queda registro auditable.",
    nex: { kind: "yes" },
    excel: { kind: "no" },
    comet: { kind: "no" },
    erp: { kind: "no" },
  },
  {
    feature: "Avisos y encuestas a las familias",
    detail: "Notificación a una categoría puntual o al club entero. Con votación.",
    nex: { kind: "yes" },
    excel: { kind: "no" },
    comet: { kind: "no" },
    erp: { kind: "no" },
  },
  {
    feature: "Fichajes AFA / planillas oficiales",
    detail: "Carga de fichas en sistema federativo.",
    nex: { kind: "no" },
    excel: { kind: "partial", label: "Manual" },
    comet: { kind: "yes" },
    erp: { kind: "no" },
  },
  {
    feature: "Soporte 1:1 por WhatsApp",
    detail: "Hablás con la gente que hace el producto, no con un ticket.",
    nex: { kind: "yes" },
    excel: { kind: "no" },
    comet: { kind: "partial", label: "Por mail" },
    erp: { kind: "partial", label: "Por mail" },
  },
];

export function ComparisonTable() {
  return (
    <section id="comparativa" className="bg-white border-y border-nex-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-widest text-nex-muted font-semibold">
            Por qué NEXCLUB
          </p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl text-nex-ink leading-[1.05] tracking-tight">
            No es otro CRM. <span className="italic text-nex">Es el club.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-nex-muted leading-relaxed">
            Las planillas, los CRMs y los sistemas federativos resuelven pedazos.
            NEXCLUB resuelve el día a día — la operación entera de un club de formativas.
          </p>
        </div>

        {/* Desktop: tabla */}
        <div className="mt-12 hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-nex-border">
                <th className="text-left py-4 pr-4 font-medium text-nex-muted text-xs uppercase tracking-widest w-[36%]">
                  Capacidad
                </th>
                <Th highlight>NEXCLUB</Th>
                <Th>Excel + WhatsApp</Th>
                <Th>ComET</Th>
                <Th>ERP genérico</Th>
              </tr>
            </thead>
            <tbody>
              {CAPS.map((cap) => (
                <tr key={cap.feature} className="border-b border-nex-border/60 last:border-0">
                  <td className="py-4 pr-4 align-top">
                    <div className="text-nex-ink font-medium">{cap.feature}</div>
                    {cap.detail && (
                      <div className="text-xs text-nex-muted mt-1 max-w-md leading-relaxed">
                        {cap.detail}
                      </div>
                    )}
                  </td>
                  <Td cell={cap.nex} highlight />
                  <Td cell={cap.excel} />
                  <Td cell={cap.comet} />
                  <Td cell={cap.erp} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards por capacidad */}
        <div className="mt-10 md:hidden space-y-4">
          {CAPS.map((cap) => (
            <MobileCard key={cap.feature} cap={cap} />
          ))}
        </div>

        <p className="mt-12 text-sm text-nex-muted italic max-w-xl">
          NEXCLUB no compite con ComET. NEXCLUB es todo lo que pasa
          <em className="not-italic text-nex-ink"> entre fichaje y fichaje</em>.
        </p>
      </div>
    </section>
  );
}

function Th({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <th
      className={`text-center py-4 px-3 font-semibold text-sm ${
        highlight ? "text-nex bg-nex-soft/40 rounded-t-lg" : "text-nex-muted"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ cell, highlight }: { cell: Cell; highlight?: boolean }) {
  return (
    <td className={`text-center py-4 px-3 align-top ${highlight ? "bg-nex-soft/40" : ""}`}>
      <CellMark cell={cell} />
    </td>
  );
}

function CellMark({ cell }: { cell: Cell }) {
  if (cell.kind === "yes") {
    return (
      <span className="inline-flex h-7 w-7 rounded-full bg-nex/15 text-nex items-center justify-center mx-auto">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }
  if (cell.kind === "no") {
    return (
      <span className="inline-flex h-7 w-7 rounded-full bg-nex-muted/10 text-nex-muted/60 items-center justify-center mx-auto">
        <Minus className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="inline-block text-xs text-nex-muted bg-nex-bg border border-nex-border rounded-full px-2.5 py-1">
      {cell.label}
    </span>
  );
}

function MobileCard({ cap }: { cap: Capability }) {
  return (
    <div className="rounded-2xl border border-nex-border bg-white p-5">
      <div className="text-nex-ink font-semibold">{cap.feature}</div>
      {cap.detail && (
        <div className="text-xs text-nex-muted mt-1 leading-relaxed">{cap.detail}</div>
      )}
      <ul className="mt-4 space-y-2 text-sm">
        <MobileRow label="NEXCLUB" cell={cap.nex} highlight />
        <MobileRow label="Excel + WhatsApp" cell={cap.excel} />
        <MobileRow label="ComET" cell={cap.comet} />
        <MobileRow label="ERP genérico" cell={cap.erp} />
      </ul>
    </div>
  );
}

function MobileRow({
  label,
  cell,
  highlight,
}: {
  label: string;
  cell: Cell;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className={highlight ? "font-semibold text-nex" : "text-nex-muted"}>{label}</span>
      <CellMark cell={cell} />
    </li>
  );
}
