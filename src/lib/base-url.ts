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
  // Primero el header, porque es lo más confiable en runtime y refleja la URL
  // por la que el cliente accedió (sirve para preview deploys, custom domains, etc).
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // Fuera de request context (build estático) — seguimos con env var o fallback.
  }

  // Override manual via env (útil en dev local con CDN o tunneling).
  // Si quedó seteada con "localhost" de un build viejo, la ignoramos.
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // Último recurso: el header aún puede ser localhost (dev local) → cae acá.
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "http";
      return `${proto}://${host}`;
    }
  } catch {}

  return "http://localhost:3000";
}
