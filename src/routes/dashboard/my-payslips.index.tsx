import { createFileRoute } from "@tanstack/react-router";
import { MyPayslipsPage } from "~/components/pay-runs/my-payslips-page";

export const Route = createFileRoute("/dashboard/my-payslips/")({
  ssr: false,
  component: MyPayslipsIndexRoute,
});

function MyPayslipsIndexRoute() {
  return <MyPayslipsPage />;
}
