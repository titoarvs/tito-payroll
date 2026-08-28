import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck,
  Table2,
  Users,
} from "lucide-react";
import type { PayRun } from "~/api-services/pay-runs.types";
import { DashboardKpiCard } from "~/components/dashboard/dashboard-kpi-card";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import {
  useContributionSchedules,
  usePayRuns,
} from "~/hooks/use-pay-runs";
import type { HrisUser } from "~/lib/hris-auth";
import { cn } from "~/lib/utils";
import { getEmployeesQuery } from "~/queries/employees";

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
  const { data: employeesData, isPending: isEmployeesPending } = useQuery({
    ...getEmployeesQuery({ page: 1, limit: 1 }),
    enabled: showEmployeeMetrics,
  });

  const payRuns = payRunsData?.data ?? [];
  const schedules = schedulesData?.data ?? [];
  const totalEmployees = employeesData?.meta.total;
  const activeSchedules = schedules.filter((schedule) => schedule.isActive).length;
  const draftRuns = countByStatus(payRuns, "draft");
  const computedRuns = countByStatus(payRuns, "computed");
  const releasedRuns = countByStatus(payRuns, "released");
  const metricsLoading =
    isPayRunsPending ||
    isSchedulesPending ||
    (showEmployeeMetrics && isEmployeesPending);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="space-y-1">
        {metricsLoading ? (
          <>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back, {displayFirstName(user)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Track payroll activity, employee records, and contribution setup at
              a glance.
            </p>
          </>
        )}
      </div>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        aria-label="Payroll metrics"
      >
        {showEmployeeMetrics ? (
          <DashboardKpiCard
            label="Employees"
            value={formatCount(totalEmployees)}
            hint="Linked to payroll"
            icon={Users}
            isLoading={isEmployeesPending}
            to="/dashboard/employees"
          />
        ) : null}
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
        <Card className="card-hover-lift lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Pay runs
            </CardTitle>
            <CardDescription>
              Create cutoffs, compute hours, and release payslips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/dashboard/pay-runs">Open pay runs</Link>
            </Button>
          </CardContent>
        </Card>

        {showEmployeeMetrics ? (
          <Card className="card-hover-lift lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                Employees
              </CardTitle>
              <CardDescription>
                Browse employee records linked to payroll.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/dashboard/employees">View employees</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card
          className={cn(
            "card-hover-lift",
            showEmployeeMetrics ? "lg:col-span-1" : "lg:col-span-2",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Table2 className="h-5 w-5 text-primary" />
              Contribution tables
            </CardTitle>
            <CardDescription>
              Maintain SSS, HDMF, and PhilHealth bracket schedules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/dashboard/contribution-tables">Manage tables</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
