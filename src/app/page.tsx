import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const { userId } = auth();

  if (userId) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } }).catch(() => null);
    if (user?.role === "ADMIN") redirect("/admin");
    if (user?.role === "PROFESOR") redirect("/profesor");
    if (user?.role === "PADRE") redirect("/padre");
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-barrancas-dark via-zinc-950 to-zinc-900 text-white">
      <div className="container mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-6 text-center">
        <Image
          src="/logo.png"
          alt="Barrancas FC"
          width={120}
          height={160}
          priority
          className="mb-6 drop-shadow-2xl"
        />
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Barrancas FC<br />
          <span className="text-barrancas-red">Gestión integral.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          Una sola plataforma para jugadores, cobranza y comunicación con padres.
          Todo en un lugar, accesible desde el celu.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="bg-barrancas-red hover:bg-barrancas-red/90 text-white">
            <Link href="/sign-in">Ingresar</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href="/sign-up">Crear cuenta</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-zinc-500">
          Usuarios demo: admin@barrancas.com · profe@barrancas.com · padre@barrancas.com<br />
          Password: demo1234
        </p>
      </div>
    </main>
  );
}
