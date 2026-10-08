import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/dashboard/final-pay")({
  ssr: false,
  component: FinalPayRoute,
});

function FinalPayRoute() {
  return (
    <PageHeader
      title="Final Pay"
      description="Separation pay for employees leaving the company."
    />
  );
}
