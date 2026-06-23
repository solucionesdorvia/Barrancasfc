/**
 * Mockup inline del padrón admin. Datos reales de Barrancas FC
 * (312 jugadores, 11 categorías). No usa Image porque queremos
 * que cargue rápido y se vea pixel-perfect en cualquier resolución.
 */
export function MockAdminPadron() {
  const players = [
    { name: "Mateo García", cat: "Sub-13", apto: "ok", paid: true, avatar: "MG", color: "bg-blue-100 text-blue-700" },
    { name: "Joaquín Pereyra", cat: "Sub-13", apto: "ok", paid: true, avatar: "JP", color: "bg-emerald-100 text-emerald-700" },
    { name: "Tomás López", cat: "Sub-15", apto: "warn", paid: false, avatar: "TL", color: "bg-amber-100 text-amber-700" },
    { name: "Santiago Romero", cat: "Sub-15", apto: "ok", paid: true, avatar: "SR", color: "bg-purple-100 text-purple-700" },
    { name: "Lautaro Díaz", cat: "Sub-11", apto: "err", paid: false, avatar: "LD", color: "bg-rose-100 text-rose-700" },
    { name: "Bautista Núñez", cat: "Inf 2014", apto: "ok", paid: true, avatar: "BN", color: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <div className="absolute inset-0 bg-zinc-50 flex flex-col text-[10px] sm:text-xs">
      {/* Top chrome */}
      <div className="h-7 border-b border-zinc-200 px-3 flex items-center gap-1.5 bg-white">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[9px] text-zinc-400">barrancas.nexclub.app/admin/jugadores</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-1/5 bg-white border-r border-zinc-200 p-2 hidden sm:flex flex-col gap-1">
          <div className="flex items-center gap-1.5 px-1.5 py-1">
            <div className="h-5 w-5 rounded-md bg-rose-600 grid place-items-center text-white text-[8px] font-bold">B</div>
            <span className="text-[9px] font-bold text-zinc-800">Barrancas FC</span>
          </div>
          <div className="mt-2 space-y-0.5">
            <div className="px-1.5 py-1 rounded text-[9px] text-zinc-500">Dashboard</div>
            <div className="px-1.5 py-1 rounded text-[9px] bg-rose-50 text-rose-700 font-medium">Jugadores</div>
            <div className="px-1.5 py-1 rounded text-[9px] text-zinc-500">Cobranza</div>
            <div className="px-1.5 py-1 rounded text-[9px] text-zinc-500">Eventos</div>
            <div className="px-1.5 py-1 rounded text-[9px] text-zinc-500">Avisos</div>
            <div className="px-1.5 py-1 rounded text-[9px] text-zinc-500">Staff</div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-zinc-900 font-bold text-sm sm:text-base">Jugadores</h3>
              <p className="text-[9px] text-zinc-500">312 totales · 11 categorías</p>
            </div>
            <div className="bg-rose-600 text-white px-2 py-1 rounded text-[9px] font-semibold">+ Nuevo</div>
          </div>

          {/* Pills filter */}
          <div className="flex gap-1 overflow-hidden">
            {["Todos", "Sub-11", "Sub-13", "Sub-15", "Inf 2014"].map((c, i) => (
              <span key={c} className={`text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{c}</span>
            ))}
          </div>

          {/* Table */}
          <div className="flex-1 bg-white rounded border border-zinc-200 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 py-1 text-[8px] uppercase text-zinc-400 font-semibold border-b border-zinc-100">
              <span>Jugador</span><span>Cat</span><span>Apto</span><span>$</span>
            </div>
            {players.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-2 py-1.5 border-b border-zinc-50 last:border-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`h-5 w-5 rounded-full ${p.color} grid place-items-center text-[8px] font-bold shrink-0`}>{p.avatar}</div>
                  <span className="text-zinc-800 font-medium truncate text-[9px] sm:text-[10px]">{p.name}</span>
                </div>
                <span className="text-[8px] text-zinc-500">{p.cat}</span>
                <span className={`text-[8px] ${p.apto === 'ok' ? 'text-emerald-600' : p.apto === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>
                  {p.apto === 'ok' ? '✓' : p.apto === 'warn' ? '!' : '✗'}
                </span>
                <span className={`text-[8px] font-medium ${p.paid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {p.paid ? '●' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
