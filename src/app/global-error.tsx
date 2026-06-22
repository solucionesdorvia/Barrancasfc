"use client";
import { Inter } from "next/font/google";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // eslint-disable-next-line no-console
  console.error("[global-error]", error);
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased min-h-dvh grid place-items-center bg-zinc-50 p-4`}>
        <div className="text-center max-w-md">
          <div className="mx-auto h-14 w-14 rounded-full bg-red-100 text-red-700 grid place-items-center mb-4">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Algo se rompió.</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tuvimos un problema inesperado. Reintentá; si persiste, contactá a soporte del club.
          </p>
          {error.digest && (
            <p className="mt-3 text-[10px] font-mono text-zinc-500">ref: {error.digest}</p>
          )}
          <Button onClick={reset} variant="outline" className="mt-5 gap-2">
            <RotateCcw className="h-4 w-4" /> Reintentar
          </Button>
        </div>
      </body>
    </html>
  );
}
