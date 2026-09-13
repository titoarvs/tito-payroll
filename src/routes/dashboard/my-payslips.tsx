import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/my-payslips")({
  ssr: false,
  component: () => <Outlet />,
});
