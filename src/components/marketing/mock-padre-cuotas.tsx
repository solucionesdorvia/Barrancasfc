/**
 * Mockup del panel del padre: vista mobile-first del estado de cuenta
 * de su hijo + acción de pago.
 */
export function MockPadreCuotas() {
  return (
    <div className="absolute inset-0 bg-rose-50/30 flex flex-col text-[10px] sm:text-xs">
      {/* Top chrome */}
      <div className="h-7 border-b border-zinc-200 px-3 flex items-center gap-1.5 bg-white">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[9px] text-zinc-400">barrancas.nexclub.app/padre</span>
      </div>

      <div className="flex-1 p-3 sm:p-4 max-w-sm mx-auto w-full flex flex-col gap-2">
        {/* Header con escudo */}
        <div className="flex items-center gap-2 pb-1">
          <div className="h-7 w-7 rounded-md bg-rose-600 grid place-items-center text-white text-[10px] font-bold">B</div>
          <div className="leading-tight">
            <p className="text-[10px] font-bold text-zinc-900">Barrancas FC</p>
            <p className="text-[8px] text-zinc-500">Hola, Carolina</p>
          </div>
          <div className="ml-auto h-6 w-6 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-[9px] font-bold">M</div>
        </div>

        {/* Hijo selector */}
        <div className="flex gap-1.5">
          <div className="flex-1 bg-rose-600 text-white px-2 py-1.5 rounded-lg text-center">
            <p className="text-[8px] opacity-80">Hijo</p>
            <p className="text-[10px] font-bold">Mateo · Sub-13</p>
          </div>
        </div>

        {/* Alerta cuota */}
        <div className="bg-amber-50 border-l-2 border-amber-500 px-2 py-1.5 rounded-r text-[9px] text-amber-900">
          <p className="font-semibold">💳 Cuota Junio vence en 5 días</p>
          <p className="text-amber-700 text-[8px] mt-0.5">$25.000 ARS</p>
        </div>

        {/* Estado de cuenta */}
        <div className="bg-white rounded-lg border border-zinc-200 p-2 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[9px] font-bold text-zinc-900">Estado de cuenta</p>
            <p className="text-[8px] text-zinc-500">3 movimientos</p>
          </div>
          {[
            { mes: "Jun 2026", amt: "$25.000", status: "Pendiente", color: "text-amber-600" },
            { mes: "May 2026", amt: "$25.000", status: "Pagado", color: "text-emerald-600" },
            { mes: "Abr 2026", amt: "$25.000", status: "Pagado", color: "text-emerald-600" },
          ].map((c) => (
            <div key={c.mes} className="flex items-center justify-between py-0.5">
              <span className="text-[9px] text-zinc-700">{c.mes}</span>
              <span className="text-[9px] text-zinc-500">{c.amt}</span>
              <span className={`text-[8px] font-medium ${c.color}`}>{c.status}</span>
            </div>
          ))}
        </div>

        {/* CTA pago */}
        <button className="bg-rose-600 text-white py-2 rounded-lg text-[10px] font-semibold">
          Pagar ahora con MercadoPago
        </button>

        {/* Próximo entreno */}
        <div className="bg-white rounded-lg border border-zinc-200 p-2">
          <p className="text-[8px] uppercase tracking-wide text-zinc-400 font-semibold">Próximo entrenamiento</p>
          <p className="text-[10px] font-bold text-zinc-900 mt-0.5">Martes 24/06 · 18:00 hs</p>
          <p className="text-[9px] text-zinc-500">Cancha 3 · Profe Cololo</p>
        </div>
      </div>
    </div>
  );
}
