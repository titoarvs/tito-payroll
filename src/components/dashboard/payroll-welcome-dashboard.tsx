import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck,
  Plus,
  Table2,
  Users,
} from "lucide-react";
import type { PayRun } from "~/api-services/pay-runs.types";
import { DashboardKpiCard } from "~/components/dashboard/dashboard-kpi-card";
import { EmployeeDashboardWidgets } from "~/components/dashboard/employee-dashboard-widgets";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import {
  useContributionSchedules,
  usePayRuns,
} from "~/hooks/use-pay-runs";
import type { HrisUser } from "~/lib/hris-auth";
import { cn } from "~/lib/utils";

interface PayrollWelcomeDashboardProps {
  showEmployeeMetrics: boolean;
}

const displayFirstName = (user: HrisUser | undefined): string => {
  if (!user) return "there";
  const first = user.firstName?.trim();
  if (first) return first;
  const fromName = user.name?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  return user.email.split("@")[0] || "there";
};

const formatCount = (value: number | undefined): string =>
  value == null ? "—" : value.toLocaleString();

const countByStatus = (runs: PayRun[], status: PayRun["status"]): number =>
  runs.filter((run) => run.status === status).length;

export const PayrollWelcomeDashboard = ({
  showEmployeeMetrics,
}: PayrollWelcomeDashboardProps) => {
  const { data: user } = useCurrentUser();
  const { data: payRunsData, isPending: isPayRunsPending } = usePayRuns();
  const { data: schedulesData, isPending: isSchedulesPending } =
    useContributionSchedules();

  const payRuns = payRunsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];
  const activeSchedules = schedules.filter((schedule) => schedule.isActive).length;
  const draftRuns = countByStatus(payRuns, "draft");
  const computedRuns = countByStatus(payRuns, "computed");
  const releasedRuns = countByStatus(payRuns, "released");
  const metricsLoading = isPayRunsPending || isSchedulesPending;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {metricsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : (
        <PageHeader
          title={`Welcome back, ${displayFirstName(user)}`}
          description="Track payroll activity, employee records, and contribution setup at a glance."
          actions={
            <>
              {showEmployeeMetrics ? (
                <Button asChild variant="outline">
                  <Link to="/dashboard/employees">
                    <Users className="h-4 w-4" />
                    Employees
                  </Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link to="/dashboard/pay-runs">
                  <Plus className="h-4 w-4" />
                  Pay runs
                </Link>
              </Button>
            </>
          }
        />
      )}

      {showEmployeeMetrics ? <EmployeeDashboardWidgets /> : null}

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
        aria-label="Payroll metrics"
      >
        <DashboardKpiCard
          label="Pay runs"
          value={formatCount(payRuns.length)}
          hint="All cutoffs"
          icon={CalendarDays}
          isLoading={isPayRunsPending}
          to="/dashboard/pay-runs"
        />
        <DashboardKpiCard
          label="Draft runs"
          value={formatCount(draftRuns)}
          hint="Awaiting compute"
          icon={Clock3}
          isLoading={isPayRunsPending}
          to="/dashboard/pay-runs"
        />
        <DashboardKpiCard
          label="Computed"
          value={formatCount(computedRuns)}
          hint="Ready to release"
          icon={CheckCircle2}
          isLoading={isPayRunsPending}
          to="/dashboard/pay-runs"
        />
        <DashboardKpiCard
          label="Released"
          value={formatCount(releasedRuns)}
          hint="Published payslips"
          icon={FileCheck}
          isLoading={isPayRunsPending}
          to="/dashboard/pay-runs"
        />
        <DashboardKpiCard
          label="Contribution tables"
          value={formatCount(activeSchedules)}
          hint={`${schedules.length} schedule${schedules.length === 1 ? "" : "s"} total`}
          icon={Table2}
          isLoading={isSchedulesPending}
          to="/dashboard/contribution-tables"
        />
      </section>

      <section
        className="grid gap-4 lg:grid-cols-3"
        aria-label="Quick actions"
      >
        <div className="tito-widget card-hover-lift flex flex-col gap-4 p-5 sm:p-6 lg:col-span-1">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <CalendarDays className="h-5 w-5 text-tito-green-text dark:text-primary" />
              Pay runs
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create cutoffs, compute hours, and release payslips.
            </p>
          </div>
          <Button asChild className="w-fit">
            <Link to="/dashboard/pay-runs">Open pay runs</Link>
          </Button>
        </div>

        {showEmployeeMetrics ? (
          <div className="tito-widget card-hover-lift flex flex-col gap-4 p-5 sm:p-6 lg:col-span-1">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                <Users className="h-5 w-5 text-tito-green-text dark:text-primary" />
                Employees
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse employee records linked to payroll.
              </p>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link to="/dashboard/employees">View employees</Link>
            </Button>
          </div>
        ) : null}

        <div
          className={cn(
            "tito-widget card-hover-lift flex flex-col gap-4 p-5 sm:p-6",
            showEmployeeMetrics ? "lg:col-span-1" : "lg:col-span-2",
          )}
        >
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <Table2 className="h-5 w-5 text-tito-green-text dark:text-primary" />
              Contribution tables
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Maintain SSS, HDMF, and PhilHealth bracket schedules.
            </p>
          </div>
          <Button asChild variant="outline" className="w-fit">
            <Link to="/dashboard/contribution-tables">Manage tables</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};
