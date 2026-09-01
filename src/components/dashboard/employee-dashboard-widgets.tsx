import { Building2, UserMinus, UserPlus, Users } from "lucide-react";
import { DashboardKpiCard } from "~/components/dashboard/dashboard-kpi-card";
import { Skeleton } from "~/components/ui/skeleton";
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
  const byDepartment = counts?.byDepartment ?? [];
  const maxDepartmentCount = Math.max(
    ...byDepartment.map((row) => row.count),
    1,
  );

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
          isLoading={isPending}
          to="/dashboard/employees"
        />
        <DashboardKpiCard
          label="Active"
          value={formatCount(counts?.activeEmployees)}
          hint="Active employment set"
          icon={UserPlus}
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
          isLoading={isPending}
          to="/dashboard/employees"
        />
        <DashboardKpiCard
          label="Inactive"
          value={formatCount(counts?.inactiveEmployees)}
          hint="Resigned / terminated / inactive"
          icon={UserMinus}
          isLoading={isPending}
          to="/dashboard/employees"
        />
      </section>

      <section
        className="tito-widget p-5 sm:p-6"
        aria-label="Employees by department"
      >
        <div className="mb-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            By department
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Headcount grouped from the employee roster.
          </p>
        </div>

        {isPending ? (
          <div className="space-y-3" role="status" aria-label="Loading departments">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : null}

        {!isPending && byDepartment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No department data yet.</p>
        ) : null}

        {!isPending && byDepartment.length > 0 ? (
          <ul className="space-y-3">
            {byDepartment.map((row) => (
              <li key={row.department} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {row.department}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.count}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-tito-green/70 dark:bg-primary/70"
                    style={{
                      width: `${Math.max(
                        (row.count / maxDepartmentCount) * 100,
                        4,
                      )}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
};
