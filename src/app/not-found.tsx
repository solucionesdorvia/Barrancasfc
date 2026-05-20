import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center px-4 bg-zinc-50">
      <div className="text-center max-w-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-zinc-100 grid place-items-center mb-4">
          <FileQuestion className="h-6 w-6 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold">No encontramos esto.</h1>
        <p className="text-sm text-muted-foreground mt-2">
          La página que buscás no existe o fue movida.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
