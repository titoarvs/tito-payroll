import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pay-runs")({
  ssr: false,
  component: () => <Outlet />,
});
