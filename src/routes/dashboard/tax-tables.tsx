import { createFileRoute } from "@tanstack/react-router";
import { TaxTablesPage } from "~/components/pay-runs/tax-tables-page";

export const Route = createFileRoute("/dashboard/tax-tables")({
  ssr: false,
  component: TaxTablesRoute,
});

function TaxTablesRoute() {
  return <TaxTablesPage />;
}
