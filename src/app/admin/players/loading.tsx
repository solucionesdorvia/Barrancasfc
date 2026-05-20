import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </Card>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
