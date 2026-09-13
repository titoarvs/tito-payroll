import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { DashboardKpiCard } from "~/components/dashboard/dashboard-kpi-card";
import { PageHeader } from "~/components/layout/page-header";
import {
  cutoffHalfLabel,
  formatPayRunPeriod,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useMyPayslips } from "~/hooks/use-pay-runs";
import type { HrisUser } from "~/lib/hris-auth";

const displayFirstName = (user: HrisUser | undefined): string => {
  if (!user) return "there";
  const first = user.firstName?.trim();
  if (first) return first;
  const fromName = user.name?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  return user.email.split("@")[0] || "there";
};

export const EmployeeWelcomeDashboard = () => {
  const { data: user } = useCurrentUser();
  const { data: payslipsData, isPending: isPayslipsPending } = useMyPayslips();
  const payslips = payslipsData?.data ?? [];
  const latest = payslips[0] ?? null;
  const latestNet = latest ? formatPayslipMoney(latest.netPay) : "—";
  const latestPeriod =
    latest?.periodStart && latest.periodEnd
      ? formatPayRunPeriod(latest.periodStart, latest.periodEnd)
      : null;
  const latestHalf = latest?.cutoffHalf
    ? cutoffHalfLabel(latest.cutoffHalf)
    : null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${displayFirstName(user)}`}
        description="Your released payslips at a glance."
        actions={
          <Button asChild>
            <Link to="/dashboard/my-payslips">
              <FileText className="h-4 w-4" />
              My payslips
            </Link>
          </Button>
        }
      />

      <section
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Payslip metrics"
      >
        <DashboardKpiCard
          label="Released payslips"
          value={
            isPayslipsPending ? "—" : payslips.length.toLocaleString()
          }
          hint="Available under My payslips"
          icon={FileText}
          isLoading={isPayslipsPending}
          to="/dashboard/my-payslips"
        />
        <DashboardKpiCard
          label="Latest net pay"
          value={isPayslipsPending ? "—" : latestNet}
          hint={
            latestPeriod
              ? [latestPeriod, latestHalf].filter(Boolean).join(" · ")
              : "No released payslip yet"
          }
          icon={FileText}
          isLoading={isPayslipsPending}
          to="/dashboard/my-payslips"
        />
      </section>

      <section className="tito-widget p-5 sm:p-6" aria-label="Latest payslip">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Latest payslip
            </h3>
            {isPayslipsPending ? (
              <Skeleton className="mt-2 h-4 w-48" />
            ) : latest ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {[latestPeriod, latestHalf].filter(Boolean).join(" · ") ||
                  "Released cutoff"}
                <span className="mx-1.5 text-border">·</span>
                <span className="font-medium tabular-nums text-foreground">
                  {latestNet}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No released payslips yet. They appear here after a pay run is
                published.
              </p>
            )}
          </div>
          {latest ? (
            <Button asChild variant="outline" size="sm">
              <Link
                to="/dashboard/my-payslips/$payslipId"
                params={{ payslipId: latest.id }}
              >
                View payslip
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/my-payslips">Open My payslips</Link>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};
