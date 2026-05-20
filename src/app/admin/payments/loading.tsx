import { PageHeaderSkeleton, KpiGridSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <KpiGridSkeleton />
      <TableSkeleton rows={8} cols={7} />
    </div>
  );
}
