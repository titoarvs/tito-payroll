import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasHrisSession } from "~/lib/hris-auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (!hasHrisSession()) {
      throw redirect({ to: "/sign-in" });
    }
    throw redirect({ to: "/dashboard" });
  },
});
