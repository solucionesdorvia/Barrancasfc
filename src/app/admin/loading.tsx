import { PageHeaderSkeleton, KpiGridSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <KpiGridSkeleton />
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
