/**
 * Helpers Edge-safe para multi-tenancy.
 *
 * Este archivo NO debe importar `react`, `next/headers` ni `@/lib/prisma`.
 * Lo consume el middleware (Edge runtime), que no tiene acceso a esas APIs.
 * `lib/club.ts` (Node runtime) re-exporta estos símbolos para no duplicar.
 */

/**
 * Hosts viejos de Railway que vamos a redirigir 301 al subdominio nuevo
 * cuando el dominio NEXCLUB esté activo. Hardcoded porque NO los podemos
 * resolver vía DB (el host viejo no tiene `customDomain`).
 */
export const RAILWAY_LEGACY_HOSTS: Record<string, string> = {
  "barrancasfc-production.up.railway.app": "barrancas",
};

/**
 * Root domain de NEXCLUB. Si cambia, se pasa por env.
 */
export const NEX_ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "nexclub.app";

/**
 * Flag que controla si el redirect 301 desde URLs viejas de Railway al
 * subdominio nuevo está activo.
 */
export const ROOT_DOMAIN_ACTIVE = process.env.NEXT_PUBLIC_ROOT_DOMAIN_ACTIVE === "true";

/**
 * Hosts que cuentan como "root" (sirven la landing pública, no un club).
 * Acepta `nexclub.app`, `www.nexclub.app`, `app.nexclub.app`.
 */
export function isRootHost(host: string): boolean {
  const cleaned = host.split(":")[0].toLowerCase();
  return (
    cleaned === NEX_ROOT_DOMAIN ||
    cleaned === `www.${NEX_ROOT_DOMAIN}` ||
    cleaned === `app.${NEX_ROOT_DOMAIN}`
  );
}

/**
 * Devuelve el subdominio si el host es <sub>.<rootDomain> o <sub>.localhost.
 * Excluye www y app (esos sirven la landing). Ignora puertos.
 */
export function extractSubdomainFromHost(host: string): string | null {
  if (!host) return null;
  const cleaned = host.split(":")[0].toLowerCase();
  const parts = cleaned.split(".");
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (sub === "www" || sub === "app") return null;
  const root = parts.slice(1).join(".");
  if (root === NEX_ROOT_DOMAIN || root === "localhost") return sub;
  return null;
}
