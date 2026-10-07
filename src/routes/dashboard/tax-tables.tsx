import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/tax-tables")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/contribution-tables" });
  },
});
