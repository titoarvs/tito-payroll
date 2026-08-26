import { createFileRoute } from "@tanstack/react-router";
import { MyPayslipsPage } from "~/components/pay-runs/my-payslips-page";

export const Route = createFileRoute("/dashboard/my-payslips")({
  ssr: false,
  component: MyPayslipsRoute,
});

function MyPayslipsRoute() {
  return <MyPayslipsPage />;
}
