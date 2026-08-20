import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  ssr: false,
  component: DashboardHomePage,
});

function DashboardHomePage() {
  return null;
}
