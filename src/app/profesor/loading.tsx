import { PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-48" />
      <Card className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </Card>
    </div>
  );
}
