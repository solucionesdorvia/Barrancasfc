import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { extractSubdomainFromHost as extractSubdomain } from "@/lib/club-edge";

// Re-export Edge-safe helpers para back-compat con imports existentes.
export {
  RAILWAY_LEGACY_HOSTS,
  NEX_ROOT_DOMAIN,
  ROOT_DOMAIN_ACTIVE,
  isRootHost,
  extractSubdomainFromHost,
} from "@/lib/club-edge";

/**
 * Branding completo de un club. Es lo que el `<html style="...">` y los
 * templates de comunicación leen para producir HTML/mensajes con la
 * cara del tenant correcto.
 */
export type ClubBrand = {
  id: string;
  slug: string | null;
  name: string;
  logo: string | null;
  tagline: string | null;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  contactWhatsapp: string | null;
  contactEmail: string | null;
};

/** Defaults NexClub. Se devuelven si el club no tiene colores en DB. */
const NEX_DEFAULTS = {
  primary: "#0F766E",
  primaryHover: "#0B574F",
  primarySoft: "#D7F0E8",
  onPrimary: "#E1F5EE",
  accent: "#F97316",
} as const;

function hydrate(c: {
  id: string;
  slug: string | null;
  name: string;
  logo: string | null;
  tagline: string | null;
  primary: string | null;
  primaryHover: string | null;
  primarySoft: string | null;
  onPrimary: string | null;
  accent: string | null;
  contactWhatsapp: string | null;
  contactEmail: string | null;
}): ClubBrand {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    logo: c.logo,
    tagline: c.tagline,
    primary: c.primary ?? NEX_DEFAULTS.primary,
    primaryHover: c.primaryHover ?? NEX_DEFAULTS.primaryHover,
    primarySoft: c.primarySoft ?? NEX_DEFAULTS.primarySoft,
    onPrimary: c.onPrimary ?? NEX_DEFAULTS.onPrimary,
    accent: c.accent ?? NEX_DEFAULTS.accent,
    contactWhatsapp: c.contactWhatsapp,
    contactEmail: c.contactEmail,
  };
}

/**
 * Resuelve el Club actual del request.
 *
 * Estrategia (por orden de prioridad):
 * 1. Subdomain del host: `barrancas.nexclub.app` → `slug='barrancas'`
 * 2. Custom domain: lookup por `Club.customDomain`
 * 3. Fallback: primer club de la DB (para hoy, mientras es single-tenant)
 *
 * Cacheado por request (`react.cache`) para evitar N queries por render.
 */
export const getCurrentClub = async (): Promise<ClubBrand | null> => {
  try {
    const h = headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();

    // 1) Subdomain de nexclub.app (excepto www y app)
    const sub = extractSubdomain(host);
    if (sub) {
      const bySlug = await prisma.club.findUnique({
        where: { slug: sub },
        select: clubFields,
      });
      if (bySlug) return hydrate(bySlug);
    }

    // 2) Custom domain (barrancasfc.com.ar)
    if (host && !host.endsWith("nexclub.app") && !host.endsWith(".railway.app") && !host.startsWith("localhost")) {
      const byDomain = await prisma.club.findUnique({
        where: { customDomain: host },
        select: clubFields,
      });
      if (byDomain) return hydrate(byDomain);
    }

    // 3) Fallback: el primer club (mono-tenant hoy)
    const fallback = await prisma.club.findFirst({
      orderBy: { createdAt: "asc" },
      select: clubFields,
    });
    return fallback ? hydrate(fallback) : null;
  } catch {
    return null;
  }
};

/**
 * El style inline que el RootLayout inyecta en <html>. Convierte los
 * hex del Club en CSS custom properties que el resto de la UI consume
 * via `bg-club`, `text-club`, etc.
 */
export function clubCssVars(brand: ClubBrand | null): React.CSSProperties {
  if (!brand) return {};
  return {
    ["--club-primary" as string]: brand.primary,
    ["--club-primary-hover" as string]: brand.primaryHover,
    ["--club-primary-soft" as string]: brand.primarySoft,
    ["--club-on-primary" as string]: brand.onPrimary,
    ["--club-accent" as string]: brand.accent,
  };
}

const clubFields = {
  id: true,
  slug: true,
  name: true,
  logo: true,
  tagline: true,
  primary: true,
  primaryHover: true,
  primarySoft: true,
  onPrimary: true,
  accent: true,
  contactWhatsapp: true,
  contactEmail: true,
} as const;

