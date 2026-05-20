import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b bg-muted/30 p-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-3 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            {Array.from({ length: cols - 1 }).map((_, c) => (
              <Skeleton key={c} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CardSkeleton({ height = "h-32" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className={height + " w-full"} />
      </CardContent>
    </Card>
  );
}

export function TimelineSkeleton({ items = 6 }: { items?: number }) {
  return (
    <ol className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <li key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ol>
  );
}
