import { PageHeaderSkeleton, TimelineSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <PageHeaderSkeleton />
      <Card><CardContent className="pt-6"><TimelineSkeleton items={10} /></CardContent></Card>
    </div>
  );
}
