import { Badge } from "@/components/ui/badge";
import type { PlayerStatus } from "@prisma/client";

const map: Record<PlayerStatus, { label: string; variant: "success" | "warning" | "secondary" | "danger" }> = {
  ACTIVE: { label: "Activo", variant: "success" },
  INJURED: { label: "Lesionado", variant: "warning" },
  INACTIVE: { label: "Inactivo", variant: "secondary" },
  SUSPENDED: { label: "Suspendido", variant: "danger" },
};

export function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
