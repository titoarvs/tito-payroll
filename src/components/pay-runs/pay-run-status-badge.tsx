import { Badge } from "~/components/ui/badge";
import type { PayRunStatus } from "~/api-services/pay-runs.types";

const STATUS_VARIANT: Record<
  PayRunStatus,
  "muted" | "secondary" | "success" | "default"
> = {
  draft: "muted",
  computed: "secondary",
  released: "success",
};

export const PayRunStatusBadge = ({ status }: { status: PayRunStatus }) => (
  <Badge variant={STATUS_VARIANT[status] ?? "muted"} className="capitalize">
    {status}
  </Badge>
);
