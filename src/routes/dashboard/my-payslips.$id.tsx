import { createFileRoute } from "@tanstack/react-router";
import { MyPayslipDetailPage } from "~/components/pay-runs/my-payslip-detail-page";

export const Route = createFileRoute("/dashboard/my-payslips/$id")({
  ssr: false,
  component: MyPayslipDetailRoute,
});

function MyPayslipDetailRoute() {
  const { id } = Route.useParams();
  return <MyPayslipDetailPage payslipId={id} />;
}
