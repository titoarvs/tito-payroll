import { createFileRoute } from "@tanstack/react-router";
import { SalaryRatesPage } from "~/components/salary-rates/salary-rates-page";

export const Route = createFileRoute("/dashboard/salary-rates")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { employeeId?: string } => ({
    employeeId:
      typeof search.employeeId === "string" && search.employeeId.trim()
        ? search.employeeId.trim()
        : undefined,
  }),
  component: SalaryRatesRoute,
});

function SalaryRatesRoute() {
  return <SalaryRatesPage />;
}
