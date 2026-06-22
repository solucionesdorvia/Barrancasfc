"use client";

import { useEffect, useState } from "react";

/**
 * Si pasan N segundos y el form de Clerk no se renderizó (porque el JS
 * todavía no cargó — típico mientras Clerk emite cert TLS para el subdomain
 * propio), mostramos un mensaje amigable en lugar de pantalla en blanco.
 *
 * El componente busca el primer <form> dentro del .cl-rootBox (que es el
 * wrapper de Clerk). Si no aparece, después de `timeoutMs` mostrá fallback.
 */
export function ClerkLoadFallback({ timeoutMs = 6000 }: { timeoutMs?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const clerkRoot = document.querySelector(".cl-rootBox, .cl-card");
      if (!clerkRoot || !clerkRoot.querySelector("form, input")) {
        setShow(true);
      }
    }, timeoutMs);
    return () => clearTimeout(t);
  }, [timeoutMs]);

  if (!show) return null;

  return (
    <div className="max-w-sm w-full mx-auto rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6 text-center space-y-4 text-white">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 mx-auto">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-base font-semibold">Estamos terminando de configurar el acceso</h2>
      <p className="text-sm text-white/70 leading-relaxed">
        El servicio de autenticación está finalizando la propagación de
        certificados (puede tardar hasta 2 horas). Si ves esta pantalla,
        intentá de nuevo en unos minutos.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-white text-nex-ink h-10 px-4 text-sm font-medium hover:bg-nex-soft transition-colors w-full"
      >
        Reintentar
      </button>
      <p className="text-[11px] text-white/40">
        Si persiste, escribinos por WhatsApp desde la{" "}
        <a href="/" className="underline underline-offset-2 hover:text-white">página principal</a>.
      </p>
    </div>
  );
}
