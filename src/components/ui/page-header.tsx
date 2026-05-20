import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Header consistente para todas las páginas internas. Usar siempre.
 */
export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-3", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
