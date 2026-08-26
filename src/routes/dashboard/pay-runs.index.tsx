import { createFileRoute } from "@tanstack/react-router";
import { PayRunsList } from "~/components/pay-runs/pay-runs-list";

export const Route = createFileRoute("/dashboard/pay-runs/")({
  ssr: false,
  component: PayRunsPage,
});

function PayRunsPage() {
  return <PayRunsList />;
}
