import { Badge } from "~/components/ui/badge";
import type { PayRunStatus } from "~/api-services/pay-runs.types";
import { payRunStatusLabel } from "~/components/pay-runs/pay-run-display";

const STATUS_VARIANT: Record<
  PayRunStatus,
  "muted" | "secondary" | "success" | "default"
> = {
  draft: "muted",
  computing: "default",
  computed: "secondary",
  released: "success",
};

export const PayRunStatusBadge = ({ status }: { status: PayRunStatus }) => (
  <Badge variant={STATUS_VARIANT[status] ?? "muted"}>
    {payRunStatusLabel(status)}
  </Badge>
);
