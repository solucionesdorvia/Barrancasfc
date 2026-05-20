import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Cuando se renderiza dentro de un Card, evitar borders dobles */
  bare?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, bare = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        !bare && "rounded-lg border border-dashed bg-muted/30",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
