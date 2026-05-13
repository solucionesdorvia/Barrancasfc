import { cn } from "@/lib/utils";

export function BrandLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-md bg-barrancas-red shadow-sm">
        <span className="font-black text-white text-sm tracking-tight">B</span>
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-white" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-barrancas-red" />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold">Barrancas FC</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Gestión</span>
        </div>
      )}
    </div>
  );
}
