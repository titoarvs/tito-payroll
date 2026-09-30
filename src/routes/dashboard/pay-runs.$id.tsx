import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/pay-runs/$id")({
  ssr: false,
  component: PayRunLayout,
});

function PayRunLayout() {
  return <Outlet />;
}
