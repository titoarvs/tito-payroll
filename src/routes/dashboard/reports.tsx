import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/page-header";

export const Route = createFileRoute("/dashboard/reports")({
  ssr: false,
  component: ReportsRoute,
});

function ReportsRoute() {
  return (
    <PageHeader
      title="Reports"
      description="Payroll reports for a cutoff or a date range."
    />
  );
}
