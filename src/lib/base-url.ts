import { headers } from "next/headers";

/**
 * Devuelve la URL base de la app (sin trailing slash).
 *
 * Orden de resolución:
 *  1. `NEXT_PUBLIC_APP_URL` si está seteada (override manual)
 *  2. Headers del request actual (`x-forwarded-proto` + `host`) — funciona
 *     en Railway, Vercel, custom domain, sin necesidad de configurar nada
 *  3. Fallback `http://localhost:3000` (solo en builds que no tienen request)
 *
 * Importante: solo es seguro llamar esto desde Server Components o Route
 * Handlers — `headers()` requiere request context. NO usar en componentes
 * que se ejecutan en build estático.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envUrl) return envUrl;

  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Fuera de request context (build estático) — caemos al fallback
  }

  return "http://localhost:3000";
}
