import { createFileRoute } from "@tanstack/react-router";
import { PayslipDetailPage } from "~/components/pay-runs/payslip-detail-page";

export const Route = createFileRoute("/dashboard/my-payslips/$payslipId")({
  ssr: false,
  component: MyPayslipDetailRoute,
});

function MyPayslipDetailRoute() {
  const { payslipId } = Route.useParams();
  return <PayslipDetailPage payslipId={payslipId} />;
}
