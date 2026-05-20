import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-4 pb-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-full rounded-full" />
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
