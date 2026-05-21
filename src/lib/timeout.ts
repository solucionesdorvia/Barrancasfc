/**
 * Race una promesa contra un timeout. Si el timeout gana, resuelve con `fallback`
 * (o rechaza si no se provee).
 *
 * Útil para queries a Postgres que de otro modo cuelgan ~30s cuando el servicio
 * está dormido en Railway. Preferimos cortar antes y caer a un fallback elegante.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeout,
  ]);
}
