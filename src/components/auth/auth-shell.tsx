import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { extractSubdomainFromHost, isRootHost } from "@/lib/club-edge";
import { prisma } from "@/lib/prisma";
import { NexClubWordmark } from "@/components/nex/wordmark";
import { PoweredByNexClub } from "@/components/nex/powered-by";

/**
 * Resuelve el club según el host del request, SIN fallback al primer club.
 * - Subdomain `<slug>.nexclub.app` → busca por slug.
 * - Custom domain → busca por customDomain.
 * - Root (`nexclub.app`, `www.nexclub.app`) → null (mostrar branding NEXCLUB).
 *
 * Es la lógica "estricta" que necesitan las pantallas de auth: en root quiero
 * NEXCLUB, en subdomain quiero el club específico — no quiero que el fallback
 * mono-tenant me muestre Barrancas cuando el usuario está en nexclub.app/sign-in.
 */
async function resolveAuthClub() {
  const h = headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  if (!host || isRootHost(host)) return null;

  const sub = extractSubdomainFromHost(host);
  if (sub) {
    return prisma.club.findUnique({
      where: { slug: sub },
      select: { name: true, logo: true, primary: true, primaryHover: true, primarySoft: true, onPrimary: true, slug: true },
    });
  }

  if (!host.endsWith("nexclub.app") && !host.endsWith(".railway.app") && !host.startsWith("localhost")) {
    return prisma.club.findUnique({
      where: { customDomain: host },
      select: { name: true, logo: true, primary: true, primaryHover: true, primarySoft: true, onPrimary: true, slug: true },
    });
  }

  return null;
}

type AuthClub = Awaited<ReturnType<typeof resolveAuthClub>>;

/**
 * Wrapper común para sign-in y sign-up:
 * - Si la pantalla se sirve desde un subdomain de club, muestra logo + nombre
 *   del club, gradient con sus colores.
 * - Si se sirve desde root, muestra wordmark NEXCLUB con paleta nex original
 *   y un copy genérico "Ingresá a tu club" (el club lo identifica luego el dispatch).
 *
 * Cada call-site pasa el `mode` para que el subtítulo se genere apropiado.
 */
type Mode = "sign-in" | "sign-up";

function subtitleFor(mode: Mode, club: AuthClub): string {
  if (club) {
    return mode === "sign-in" ? "Ingresá a tu cuenta" : `Creá tu cuenta en ${club.name}`;
  }
  return mode === "sign-in" ? "Ingresá a tu club" : "Creá tu cuenta en NEXCLUB";
}

export async function AuthShell({
  children,
  mode,
  footer,
}: {
  children: React.ReactNode;
  mode: Mode;
  footer?: React.ReactNode;
}) {
  const club = await resolveAuthClub();
  const subtitle = subtitleFor(mode, club);

  if (club) {
    return <ClubAuthScreen club={club} subtitle={subtitle} footer={footer}>{children}</ClubAuthScreen>;
  }
  return <NexAuthScreen subtitle={subtitle} footer={footer}>{children}</NexAuthScreen>;
}

function ClubAuthScreen({
  club,
  children,
  subtitle,
  footer,
}: {
  club: NonNullable<AuthClub>;
  children: React.ReactNode;
  subtitle: string;
  footer?: React.ReactNode;
}) {
  const primary = club.primary ?? "#0F766E";
  const primarySoft = club.primarySoft ?? "#E1F5EE";

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6"
      style={{ background: `linear-gradient(135deg, ${primarySoft} 0%, #ffffff 50%, ${primarySoft} 100%)` }}
    >
      <div className="flex flex-col items-center gap-3">
        {club.logo && (
          <Image
            src={club.logo}
            alt={club.name}
            width={72}
            height={72}
            className="drop-shadow-md"
            priority
          />
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: primary }}>{club.name}</h1>
          <p className="text-sm text-zinc-600 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
      {footer}
      <PoweredByNexClub className="text-zinc-500 hover:text-zinc-700" />
    </div>
  );
}

function NexAuthScreen({
  children,
  subtitle,
  footer,
}: {
  children: React.ReactNode;
  subtitle: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-br from-nex-soft via-white to-nex-soft p-6">
      <div className="flex flex-col items-center gap-2">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <NexClubWordmark size="lg" />
        </Link>
        <p className="text-sm text-zinc-600">{subtitle}</p>
      </div>
      <div className="relative">
        {children}
      </div>
      {footer}
    </div>
  );
}
