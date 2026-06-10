"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type AcceptResponse = {
  ok: true;
  role: "ADMIN" | "PROFESOR" | "PADRE";
};

/**
 * Resuelve a dónde mandar al usuario después de aceptar la invitación.
 *
 * Profes y padres recién creados arrancan con profileCompleted=false en la
 * DB, así que la ruta /onboarding del rol correspondiente es el destino
 * directo. Admins van al dashboard.
 *
 * Antes redirigíamos a "/" (landing público) y dependíamos de una cadena de
 * redirects server-side a través de layouts y guards — eso causaba flicker
 * del landing público en mobile y a veces la cookie de Clerk no propagaba
 * a tiempo y quedaba colgado en home.
 */
function destinationFor(role: "ADMIN" | "PROFESOR" | "PADRE"): string {
  if (role === "PROFESOR") return "/profesor/onboarding";
  if (role === "PADRE") return "/padre/onboarding";
  return "/admin";
}

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [destination, setDestination] = useState<string>("/");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invitations/by-token/${params.token}/accept`, {
          method: "POST",
        });
        if (cancelled) return;
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error ?? "No pudimos aceptar la invitación.");
          setStatus("error");
          return;
        }
        const data = (await res.json().catch(() => null)) as AcceptResponse | null;
        const dest = data?.role ? destinationFor(data.role) : "/";
        setDestination(dest);
        setStatus("ok");
        // Redirect inmediato — no hace falta countdown.
        router.replace(dest);
      } catch {
        if (!cancelled) {
          setError("Error de conexión. Probá de nuevo en unos segundos.");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.token, router]);

  return (
    <main className="min-h-dvh bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 text-white grid place-items-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <Image src="/logo.png" alt="Barrancas FC" width={70} height={92} priority className="mx-auto drop-shadow-2xl" />

        {status === "loading" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-barrancas-red" />
            <p className="text-sm">Activando tu cuenta…</p>
          </div>
        )}

        {status === "ok" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 grid place-items-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold">¡Listo!</h1>
            <p className="text-sm text-zinc-400">Tu cuenta quedó vinculada al club.</p>
            {/* Fallback por si el router.replace no se ejecuta (raro pero posible) */}
            <Button asChild className="w-full bg-barrancas-red hover:bg-barrancas-red/90">
              <Link href={destination}>Continuar</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-500/20 grid place-items-center">
              <AlertCircle className="h-6 w-6 text-red-300" />
            </div>
            <h1 className="text-lg font-bold">No se pudo activar</h1>
            <p className="text-sm text-zinc-400">{error}</p>
            <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
