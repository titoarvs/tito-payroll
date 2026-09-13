import { Building2, UserMinus, UserPlus, Users } from "lucide-react";
import { DashboardKpiCard } from "~/components/dashboard/dashboard-kpi-card";
import { useEmployeeDashboard } from "~/hooks/use-employees";
import { cn } from "~/lib/utils";

const formatCount = (value: number | undefined): string =>
  value == null ? "—" : value.toLocaleString();

interface EmployeeDashboardWidgetsProps {
  className?: string;
}

export const EmployeeDashboardWidgets = ({
  className,
}: EmployeeDashboardWidgetsProps) => {
  const { data, isPending } = useEmployeeDashboard({}, true);
  const counts = data?.data.counts;

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-4", className)}>
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Employee metrics"
      >
        <DashboardKpiCard
          label="Total employees"
          value={formatCount(counts?.totalEmployees)}
          hint="All statuses"
          icon={Users}
          accent="blue"
          isLoading={isPending}
          to="/dashboard/employees"
        />
        <DashboardKpiCard
          label="Active"
          value={formatCount(counts?.activeEmployees)}
          hint="Active employment set"
          icon={UserPlus}
          accent="green"
          isLoading={isPending}
          to="/dashboard/employees"
        />
        <DashboardKpiCard
          label="New"
          value={formatCount(counts?.newEmployees)}
          hint={
            counts
              ? `${counts.newEmployeesFrom} → ${counts.newEmployeesTo}`
              : "Recent hires"
          }
          icon={Building2}
          accent="sky"
          isLoading={isPending}
          to="/dashboard/employees"
        />
        <DashboardKpiCard
          label="Inactive"
          value={formatCount(counts?.inactiveEmployees)}
          hint="Resigned / terminated / inactive"
          icon={UserMinus}
          accent="slate"
          isLoading={isPending}
          to="/dashboard/employees"
        />
      </section>
    </div>
  );
};
