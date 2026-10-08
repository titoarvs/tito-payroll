import { createFileRoute } from "@tanstack/react-router";
import { CreatePayRunPage } from "~/components/pay-runs/create-pay-run-page";

export const Route = createFileRoute("/dashboard/pay-runs/new")({
  ssr: false,
  component: CreatePayRunRoute,
});

function CreatePayRunRoute() {
  return <CreatePayRunPage />;
}
