import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentHrisUser, type HrisUser } from "~/lib/hris-auth";

const isSuperAdmin = (user: HrisUser): boolean => {
  if (user.role === "super_admin") return true;
  return user.roles?.includes("super_admin") === true;
};

export const Route = createFileRoute("/dashboard/employees")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getCurrentHrisUser();
    if (!isSuperAdmin(user)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: EmployeesLayout,
});

function EmployeesLayout() {
  return <Outlet />;
}
