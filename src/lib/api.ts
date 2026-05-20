import { NextResponse } from "next/server";

/**
 * Wrappers consistentes para respuestas API.
 * Usar siempre en lugar de NextResponse.json crudo.
 */

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra ?? {}) }, { status });
}

export function apiBadRequest(message = "Body inválido", extra?: Record<string, unknown>) {
  return apiError(message, 400, extra);
}

export function apiUnauthorized(message = "No autorizado") {
  return apiError(message, 401);
}

export function apiForbidden(message = "Sin permisos") {
  return apiError(message, 403);
}

export function apiNotFound(message = "Recurso no encontrado") {
  return apiError(message, 404);
}

export function apiConflict(message: string, extra?: Record<string, unknown>) {
  return apiError(message, 409, extra);
}

export function apiServerError(message = "Error interno del servidor") {
  return apiError(message, 500);
}

/**
 * Envuelve un handler con try/catch y devuelve 500 si algo explota.
 * Logguea el error completo en consola para que aparezca en Railway logs.
 */
export function withErrorHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error("[api] handler failed:", err.stack ?? err.message);
      return apiServerError(process.env.NODE_ENV === "production" ? "Error interno" : err.message);
    }
  };
}
