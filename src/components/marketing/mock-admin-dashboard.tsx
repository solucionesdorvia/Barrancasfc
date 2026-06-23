/**
 * Mockup del dashboard del admin: KPIs, gráfico de cobranza,
 * actividad reciente.
 */
export function MockAdminDashboard() {
  return (
    <div className="absolute inset-0 bg-zinc-50 flex flex-col text-[10px] sm:text-xs">
      {/* Top chrome */}
      <div className="h-7 border-b border-zinc-200 px-3 flex items-center gap-1.5 bg-white">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[9px] text-zinc-400">barrancas.nexclub.app/admin</span>
      </div>

      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-zinc-900 font-bold text-sm sm:text-base">Dashboard</h3>
            <p className="text-[9px] text-zinc-500">Barrancas FC · Junio 2026</p>
          </div>
          <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">● en vivo</span>
        </div>

        {/* KPIs grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "Ingresos mes", val: "$1.87M", delta: "+12%", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Cuotas al día", val: "78%", delta: "+4%", color: "text-emerald-600", bg: "bg-blue-50" },
            { label: "Asistencia", val: "82%", delta: "-3%", color: "text-rose-600", bg: "bg-amber-50" },
            { label: "Aptos OK", val: "297", delta: "/312", color: "text-zinc-500", bg: "bg-purple-50" },
          ].map((k) => (
            <div key={k.label} className={`${k.bg} rounded p-1.5`}>
              <p className="text-[7px] uppercase tracking-wide text-zinc-500 font-semibold truncate">{k.label}</p>
              <p className="text-[12px] sm:text-sm font-bold text-zinc-900 leading-tight">{k.val}</p>
              <p className={`text-[8px] ${k.color} font-medium`}>{k.delta}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded border border-zinc-200 p-2 flex-1 flex flex-col">
          <div className="flex items-baseline justify-between mb-1">
            <p className="text-[9px] font-bold text-zinc-900">Cobranza por categoría</p>
            <p className="text-[8px] text-zinc-500">Junio</p>
          </div>
          <div className="flex-1 flex items-end gap-1 px-1">
            {[
              { cat: "TPA", h: 95, color: "bg-rose-500" },
              { cat: "4ta", h: 82, color: "bg-rose-400" },
              { cat: "5ta", h: 88, color: "bg-rose-500" },
              { cat: "6ta", h: 76, color: "bg-rose-400" },
              { cat: "7ma", h: 91, color: "bg-rose-500" },
              { cat: "8va", h: 70, color: "bg-rose-400" },
              { cat: "9na", h: 84, color: "bg-rose-500" },
              { cat: "2013", h: 65, color: "bg-amber-400" },
              { cat: "2014", h: 78, color: "bg-rose-400" },
              { cat: "2015", h: 88, color: "bg-rose-500" },
              { cat: "2016", h: 92, color: "bg-rose-500" },
            ].map((b) => (
              <div key={b.cat} className="flex-1 flex flex-col items-center gap-0.5 group">
                <div className={`${b.color} w-full rounded-t`} style={{ height: `${b.h}%` }} />
                <span className="text-[6px] sm:text-[7px] text-zinc-400">{b.cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white rounded border border-zinc-200 p-2 space-y-0.5">
          <p className="text-[9px] font-bold text-zinc-900 mb-1">Actividad reciente</p>
          {[
            { who: "Carolina P.", what: "pagó cuota Junio", when: "hace 5 min", color: "bg-emerald-500" },
            { who: "Profe Cololo", what: "tomó asistencia Sub-13", when: "hace 22 min", color: "bg-blue-500" },
            { who: "Comisión", what: "envió aviso a 312 padres", when: "hace 1 h", color: "bg-rose-500" },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${a.color}`} />
              <span className="text-[8px] text-zinc-700 truncate flex-1">
                <span className="font-medium">{a.who}</span> {a.what}
              </span>
              <span className="text-[7px] text-zinc-400 shrink-0">{a.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
