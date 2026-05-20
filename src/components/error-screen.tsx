"use client";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Pantalla de error genérica para usar en cada error.tsx de cada route.
 * Loggea el error en consola y deja al usuario reintentar.
 */
export function ErrorScreen({
  error,
  reset,
  title = "Algo no salió bien",
  description = "Hubo un problema al cargar esta sección. Probá reintentar; si vuelve a fallar, contactá a soporte.",
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
}) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.error("[ui/error] ", error);
  }
  return (
    <div className="flex items-center justify-center min-h-[40vh] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 text-red-700 grid place-items-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {error.digest && (
              <p className="mt-3 text-[10px] font-mono text-muted-foreground/60">ref: {error.digest}</p>
            )}
          </div>
          {reset && (
            <Button onClick={reset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reintentar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
