import { createFileRoute } from "@tanstack/react-router";
import { ContributionTablesPage } from "~/components/pay-runs/contribution-tables-page";

export const Route = createFileRoute("/dashboard/contribution-tables")({
  ssr: false,
  component: ContributionTablesRoute,
});

function ContributionTablesRoute() {
  return <ContributionTablesPage />;
}
