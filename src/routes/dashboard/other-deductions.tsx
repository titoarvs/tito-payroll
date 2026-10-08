import { createFileRoute } from "@tanstack/react-router";
import { ContributionTablesPage } from "~/components/pay-runs/contribution-tables-page";

export const Route = createFileRoute("/dashboard/other-deductions")({
  ssr: false,
  component: OtherDeductionsRoute,
});

function OtherDeductionsRoute() {
  return (
    <ContributionTablesPage title="Other Deductions & Categories" />
  );
}
