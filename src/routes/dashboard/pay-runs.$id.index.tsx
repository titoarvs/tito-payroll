import { createFileRoute } from "@tanstack/react-router";
import { PayRunDetail } from "~/components/pay-runs/pay-run-detail";

export const Route = createFileRoute("/dashboard/pay-runs/$id/")({
  ssr: false,
  component: PayRunDetailPage,
});

function PayRunDetailPage() {
  const { id } = Route.useParams();
  return <PayRunDetail payRunId={id} />;
}
