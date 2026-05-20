import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full md:w-[420px]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent></Card>
        <Card><CardHeader><Skeleton className="h-4 w-32" /></CardHeader><CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent></Card>
      </div>
    </div>
  );
}
