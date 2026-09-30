import { createFileRoute } from "@tanstack/react-router";
import { PayRunPayslipPage } from "~/components/pay-runs/pay-run-payslip-page";

export const Route = createFileRoute(
  "/dashboard/pay-runs/$id/payslips/$payslipId",
)({
  ssr: false,
  component: PayRunPayslipRoute,
});

function PayRunPayslipRoute() {
  const { id, payslipId } = Route.useParams();
  return <PayRunPayslipPage payRunId={id} payslipId={payslipId} />;
}
