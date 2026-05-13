import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@prisma/client";

const map: Record<PaymentStatus, { label: string; variant: "success" | "warning" | "danger" | "secondary" }> = {
  PAID: { label: "Pagado", variant: "success" },
  PENDING: { label: "Pendiente", variant: "warning" },
  OVERDUE: { label: "Moroso", variant: "danger" },
  IN_PLAN: { label: "En plan", variant: "secondary" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
