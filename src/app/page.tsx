import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Users, Wallet, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDbUser } from "@/lib/auth";

export default async function Home() {
  const { userId } = auth();

  if (userId) {
    const user = await getDbUser().catch(() => null);
    if (user?.role === "ADMIN") redirect("/admin");
    if (user?.role === "PROFESOR") redirect("/profesor");
    if (user?.role === "PADRE") redirect("/padre");
    redirect("/onboarding");
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-32 h-96 w-96 bg-barrancas-red/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 bg-red-600/15 rounded-full blur-3xl" />
      </div>
      <div className="relative container mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-6 text-center py-12">
        <Image
          src="/logo.png"
          alt="Barrancas FC"
          width={120}
          height={160}
          priority
          className="mb-6 drop-shadow-2xl"
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-barrancas-red animate-pulse" />
          NEXCLUB · Plataforma del club
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
          Barrancas FC<br />
          <span className="text-barrancas-red">Gestión integral.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base md:text-lg text-zinc-400">
          Jugadores, cobranza, asistencia y comunicación con padres. Todo en un lugar, accesible desde el celu.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-barrancas-red hover:bg-barrancas-red/90 text-white shadow-lg shadow-barrancas-red/20">
            <Link href="/sign-in">Ingresar</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
            <Link href="/sign-up">Crear cuenta</Link>
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 w-full max-w-3xl">
          <Feature icon={Users} label="Plantel unificado" />
          <Feature icon={Wallet} label="Cobranza al día" />
          <Feature icon={Smartphone} label="Padres conectados" />
          <Feature icon={ShieldCheck} label="Auditoría total" />
        </div>

        <p className="mt-12 text-xs text-zinc-500 max-w-md">
          Usuarios de demo: admin@barrancas.com · profe@barrancas.com · padre@barrancas.com<br />
          Contraseña: <span className="font-mono">Valen050203!</span>
        </p>
      </div>
    </main>
  );
}

function Feature({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-300 backdrop-blur">
      <Icon className="h-5 w-5 text-barrancas-red" />
      <span className="text-center">{label}</span>
    </div>
  );
}
