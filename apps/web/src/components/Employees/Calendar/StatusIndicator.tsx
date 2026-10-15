import { Badge } from "@/components/ui/badge";
import {
  AttendanceStatus,
  getStatusBadgeVariant,
  STATUS_PRESENTATION,
} from "@/utils/calendar.types";

interface StatusIndicatorProps {
  status: AttendanceStatus | null;
  className?: string;
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { code, label } = STATUS_PRESENTATION[status];

  return (
    <Badge
      variant={getStatusBadgeVariant(status)}
      title={label}
      className={className}
    >
      {code}
    </Badge>
  );
}
