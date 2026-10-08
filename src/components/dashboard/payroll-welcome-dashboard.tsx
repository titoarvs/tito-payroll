import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, FileCheck, Plus, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import type { PayRun, PayRunStatus } from "~/api-services/pay-runs.types";
import { EmployeeDashboardWidgets } from "~/components/dashboard/employee-dashboard-widgets";
import {
  cutoffHalfLabel,
  formatPayRunPeriod,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import { PayRunStatusBadge } from "~/components/pay-runs/pay-run-status-badge";
import { Button } from "~/components/ui/button";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useEmployeeDashboard } from "~/hooks/use-employees";
import {
  useContributionSchedules,
  usePayRuns,
  usePayrollDashboardSummary,
} from "~/hooks/use-pay-runs";
import {
  DASHBOARD_DATE_PRESETS,
  defaultDashboardDateRange,
  payRunOverlapsRange,
  rangeForPreset,
  toDashboardDateRange,
  toPickerDateRange,
  type DashboardDateRange,
} from "~/lib/dashboard-date-range";
import type { HrisUser } from "~/lib/hris-auth";
import { canProcessPayRuns } from "~/lib/payroll-access";
import { cn } from "~/lib/utils";

interface PayrollWelcomeDashboardProps {
  showEmployeeMetrics: boolean;
}

type StatusFilter = "all" | PayRunStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All cutoffs" },
  { id: "draft", label: "Draft" },
  { id: "computing", label: "Computing" },
  { id: "computed", label: "Computed" },
  { id: "released", label: "Released" },
];

/** Distinct status hues: slate → amber → blue → green. */
const STATUS_COLORS: Record<PayRunStatus, string> = {
  draft: "color-mix(in srgb, var(--tito-dull-blue) 42%, #c5d0e0)",
  computing: "color-mix(in srgb, var(--tito-dull-blue) 70%, #e8a317)",
  computed: "var(--tito-dull-blue)",
  released: "var(--tito-green)",
};

const displayFirstName = (user: HrisUser | undefined): string => {
  if (!user) return "there";
  const first = user.firstName?.trim();
  if (first) return first;
  const fromName = user.name?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  return user.email.split("@")[0] || "there";
};

const formatPeso = (value: string): string => {
  if (value === "—") return value;
  if (value.startsWith("-")) return `-₱${value.slice(1)}`;
  return `₱${value}`;
};

const formatCount = (value: number | undefined): string =>
  value == null ? "—" : value.toLocaleString();

const countByStatus = (runs: PayRun[], status: PayRunStatus): number =>
  runs.filter((run) => run.status === status).length;

const monthKey = (iso: string): string => {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 7);
  return format(date, "yyyy-MM");
};

const monthLabel = (key: string): string => {
  const [year, month] = key.split("-").map(Number);
  if (!year || !month) return key;
  return format(new Date(year, month - 1, 1), "MMM");
};

type MonthBucket = {
  key: string;
  label: string;
  draft: number;
  computing: number;
  computed: number;
  released: number;
  total: number;
};

const buildMonthBuckets = (runs: PayRun[]): MonthBucket[] => {
  const map = new Map<string, MonthBucket>();
  for (const run of runs) {
    const key = monthKey(run.periodStart);
    const existing = map.get(key) ?? {
      key,
      label: monthLabel(key),
      draft: 0,
      computing: 0,
      computed: 0,
      released: 0,
      total: 0,
    };
    existing[run.status] += 1;
    existing.total += 1;
    map.set(key, existing);
  }
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-8);
};

export const PayrollWelcomeDashboard = ({
  showEmployeeMetrics,
}: PayrollWelcomeDashboardProps) => {
  const { data: user } = useCurrentUser();
  const mayProcess = canProcessPayRuns(user);
  const [dateRange, setDateRange] = useState<DashboardDateRange>(
    defaultDashboardDateRange,
  );
  const { data: payRunsData, isPending: isPayRunsPending } = usePayRuns();
  const { data: summaryData, isPending: isSummaryPending } =
    usePayrollDashboardSummary(dateRange.from, dateRange.to);
  const { data: schedulesData, isPending: isSchedulesPending } =
    useContributionSchedules();
  const { data: employeeDash, isPending: isEmployeesPending } =
    useEmployeeDashboard({}, showEmployeeMetrics);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const allPayRuns = payRunsData?.data ?? [];
  const payRuns = useMemo(
    () =>
      allPayRuns.filter((run) =>
        payRunOverlapsRange(
          run.periodStart,
          run.periodEnd,
          dateRange.from,
          dateRange.to,
        ),
      ),
    [allPayRuns, dateRange.from, dateRange.to],
  );
  const money = summaryData?.data;
  const releasedMoney = money?.released;
  const latestReleased = money?.latestReleased;
  const schedules = schedulesData?.data ?? [];
  const activeSchedules = schedules.filter((s) => s.isActive).length;
  const draftRuns = countByStatus(payRuns, "draft");
  const computingRuns = countByStatus(payRuns, "computing");
  const computedRuns = countByStatus(payRuns, "computed");
  const releasedRuns = countByStatus(payRuns, "released");
  const employeeCounts = employeeDash?.data.counts;
  const monthBuckets = useMemo(() => buildMonthBuckets(payRuns), [payRuns]);
  const maxMonthTotal = Math.max(1, ...monthBuckets.map((b) => b.total));

  const filteredRuns = useMemo(() => {
    const list =
      statusFilter === "all"
        ? payRuns
        : payRuns.filter((run) => run.status === statusFilter);
    return [...list]
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
      .slice(0, 8);
  }, [payRuns, statusFilter]);

  const statusSegments = [
    { id: "released" as const, label: "Released", count: releasedRuns },
    { id: "computed" as const, label: "Computed", count: computedRuns },
    { id: "computing" as const, label: "Computing", count: computingRuns },
    { id: "draft" as const, label: "Draft", count: draftRuns },
  ];
  const statusTotal = Math.max(1, payRuns.length);

  const metricsLoading =
    isPayRunsPending ||
    isSummaryPending ||
    isSchedulesPending ||
    (showEmployeeMetrics && isEmployeesPending);

  const applyPreset = (presetId: (typeof DASHBOARD_DATE_PRESETS)[number]["id"]) => {
    const next = toDashboardDateRange(rangeForPreset(presetId), presetId);
    if (next) setDateRange(next);
  };

  const handleRangeChange = (range: DateRange | undefined) => {
    if (!range?.from || !range.to) return;
    const next = toDashboardDateRange(range, "custom");
    if (next) setDateRange(next);
  };

  const pickerValue = useMemo(
    () => toPickerDateRange(dateRange),
    [dateRange],
  );

  const periodText = formatPayRunPeriod(dateRange.from, dateRange.to);
  const presetLabel = DASHBOARD_DATE_PRESETS.find(
    (p) => p.id === dateRange.preset,
  )?.label;
  const rangeLabel =
    dateRange.preset === "custom"
      ? `Custom · ${periodText}`
      : `${presetLabel ?? "Range"} · ${periodText}`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 md:gap-7">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          {metricsLoading ? (
            <>
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </>
          ) : (
            <>
              <h1 className="page-title text-2xl font-semibold tracking-tight text-foreground">
                Welcome back, {displayFirstName(user)}
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Cutoffs, people, and contribution tables — one place to keep
                payroll moving.
              </p>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker
            id="dashboard-date-range"
            value={pickerValue}
            onChange={handleRangeChange}
            align="end"
            className="w-[min(100%,20rem)] sm:w-[22rem]"
            numberOfMonths={2}
            formatLabel={() => rangeLabel}
            sidebar={({ applyRange, setDraft }) => (
              <div className="flex h-full flex-col gap-px">
                <p className="px-1.5 pb-1 text-[10px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                  Presets
                </p>
                {DASHBOARD_DATE_PRESETS.map((preset) => {
                  const active = dateRange.preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        const range = rangeForPreset(preset.id);
                        applyRange(range);
                        applyPreset(preset.id);
                      }}
                      className={cn(
                        "rounded-md px-1.5 py-1 text-left text-[11px] font-medium leading-tight tracking-[0.01em] transition-colors duration-100 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
                        active
                          ? "bg-tito-blue text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <div className="my-1.5 border-t border-border/40" />
                <button
                  type="button"
                  onClick={() => {
                    setDateRange((prev) => ({ ...prev, preset: "custom" }));
                    setDraft({
                      from: pickerValue.from,
                      to: undefined,
                    });
                  }}
                  className={cn(
                    "rounded-md px-1.5 py-1 text-left text-[11px] font-medium leading-tight tracking-[0.01em] transition-colors duration-100 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
                    dateRange.preset === "custom"
                      ? "bg-tito-blue text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  Custom range
                </button>
                <p className="mt-auto px-1.5 pt-2 text-[10px] leading-snug tracking-[0.01em] text-muted-foreground">
                  Start date, then end date.
                </p>
              </div>
            )}
          />
        </div>
      </div>

      <section className="payroll-highlight" aria-label="Released net pay">
        <div className="payroll-highlight__lead">
          <p className="payroll-highlight__eyebrow">{rangeLabel}</p>
          <h2 className="payroll-highlight__label">Net pay</h2>
          {isSummaryPending ? (
            <Skeleton className="mt-3 h-14 w-56" />
          ) : (
            <p className="payroll-highlight__figure">
              {formatPeso(formatPayslipMoney(releasedMoney?.netPay))}
            </p>
          )}
          <span className="payroll-highlight__rule" aria-hidden />
          <div className="payroll-highlight__meta">
            <p>
              {isSummaryPending
                ? "Released payslips in this range"
                : `${formatCount(releasedMoney?.payslipCount)} released slips`}
            </p>
            {latestReleased ? (
              <p>
                Latest{" "}
                {formatPayRunPeriod(
                  latestReleased.periodStart,
                  latestReleased.periodEnd,
                )}{" "}
                ({cutoffHalfLabel(latestReleased.cutoffHalf)})
              </p>
            ) : null}
          </div>
          <div className="payroll-highlight__actions">
            <Button asChild>
              <Link to={mayProcess ? "/dashboard/pay-runs/new" : "/dashboard/pay-runs"}>
                {mayProcess ? "Run the next cutoff" : "Open pay runs"}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            {latestReleased ? (
              <Button asChild variant="outline">
                <Link
                  to="/dashboard/pay-runs/$id"
                  params={{ id: latestReleased.payRunId }}
                >
                  Latest cutoff
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <dl className="payroll-highlight__rail">
          <HighlightStat
            label="Gross salaries"
            value={
              isSummaryPending
                ? null
                : formatPeso(formatPayslipMoney(releasedMoney?.grossPay))
            }
            hint="Basic, allowances, premiums"
          />
          <HighlightStat
            label="Deductions"
            value={
              isSummaryPending
                ? null
                : formatPeso(formatPayslipMoney(releasedMoney?.totalDeductions))
            }
            hint="Contributions and withholdings"
          />
          <HighlightStat
            label="Contributions"
            value={
              isSummaryPending
                ? null
                : formatPeso(formatPayslipMoney(releasedMoney?.contributionsTotal))
            }
            hint="SSS, Pag-IBIG, PhilHealth"
            to="/dashboard/contribution-tables"
          />
          <HighlightStat
            label={showEmployeeMetrics ? "Employees" : "Cutoffs"}
            value={
              metricsLoading
                ? null
                : formatCount(
                    showEmployeeMetrics
                      ? employeeCounts?.totalEmployees
                      : payRuns.length,
                  )
            }
            hint={
              showEmployeeMetrics
                ? `${formatCount(employeeCounts?.activeEmployees)} active · ${formatCount(releasedRuns)} released`
                : `${formatCount(releasedRuns)} released · ${formatCount(computedRuns)} ready`
            }
            to={
              showEmployeeMetrics ? "/dashboard/employees" : "/dashboard/pay-runs"
            }
          />
        </dl>
      </section>

      <section className="flex flex-col gap-4" aria-label="Payroll money totals">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="tito-widget border-border/60 p-5 sm:p-6 lg:col-span-7">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Contribution breakdown
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Employee share across released cutoffs
            </p>
            {isSummaryPending ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-border/50">
                {(
                  [
                    {
                      id: "sss",
                      label: "SSS",
                      amount: releasedMoney?.sss,
                      tone: "bg-tito-green",
                    },
                    {
                      id: "hdmf",
                      label: "Pag-IBIG (HDMF)",
                      amount: releasedMoney?.hdmf,
                      tone: "bg-tito-dull-blue",
                    },
                    {
                      id: "philhealth",
                      label: "PhilHealth",
                      amount: releasedMoney?.philhealth,
                      tone: "bg-tito-blue",
                    },
                  ] as const
                ).map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        className={cn("size-2 rounded-full", row.tone)}
                        aria-hidden
                      />
                      {row.label}
                    </span>
                    <span className="tabular-nums text-sm font-semibold text-foreground">
                      {formatPeso(formatPayslipMoney(row.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="tito-widget border-border/60 p-5 sm:p-6 lg:col-span-5">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Other earnings
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Premiums and adjustments in released slips
            </p>
            {isSummaryPending ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {(
                  [
                    {
                      label: "Overtime",
                      amount: releasedMoney?.overtimePay,
                    },
                    {
                      label: "Night differential",
                      amount: releasedMoney?.nightDiffPay,
                    },
                    {
                      label: "Holiday pay",
                      amount: releasedMoney?.holidayPay,
                    },
                    {
                      label: "Adjustments",
                      amount: releasedMoney?.totalAdjustments,
                    },
                  ] as const
                ).map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {formatPeso(formatPayslipMoney(row.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {showEmployeeMetrics ? (
        <EmployeeDashboardWidgets className="gap-4" />
      ) : null}

      {/* Chart + status */}
      <section
        className="grid gap-4 xl:grid-cols-12"
        aria-label="Payroll activity"
      >
        <div className="tito-widget flex min-h-80 flex-col border-border/60 p-5 sm:p-6 xl:col-span-7">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Cutoff activity
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pay runs by month · stacked by status
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <LegendDot color={STATUS_COLORS.released} label="Released" />
              <LegendDot color={STATUS_COLORS.computed} label="Computed" />
              <LegendDot color={STATUS_COLORS.draft} label="Draft" />
            </div>
          </div>

          {isPayRunsPending ? (
            <Skeleton className="min-h-0 flex-1 rounded-lg" />
          ) : monthBuckets.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              No pay runs yet. Create a cutoff to see activity here.
            </div>
          ) : (
            <div className="flex h-52 items-end gap-2 sm:h-56 sm:gap-3">
              {monthBuckets.map((bucket) => (
                <MonthBar
                  key={bucket.key}
                  bucket={bucket}
                  maxTotal={maxMonthTotal}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 xl:col-span-5">
          <div className="tito-widget flex flex-col gap-4 border-border/60 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Pipeline status
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCount(payRuns.length)} total cutoffs
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-tito-dull-blue/12 text-tito-dull-blue dark:bg-tito-dull-blue/25 dark:text-[#9eb6e0]">
                <FileCheck className="size-4" aria-hidden />
              </div>
            </div>

            {isPayRunsPending ? (
              <Skeleton className="h-3 w-full rounded-full" />
            ) : (
              <>
                <div
                  className="flex h-3 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label="Pay run status breakdown"
                >
                  {statusSegments.map((segment) => {
                    const pct = (segment.count / statusTotal) * 100;
                    if (segment.count === 0) return null;
                    return (
                      <div
                        key={segment.id}
                        className="h-full transition-[width] duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_COLORS[segment.id],
                        }}
                        title={`${segment.label}: ${segment.count}`}
                      />
                    );
                  })}
                </div>
                <ul className="space-y-2.5">
                  {statusSegments.map((segment) => {
                    const pct = Math.round((segment.count / statusTotal) * 100);
                    return (
                      <li
                        key={segment.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: STATUS_COLORS[segment.id],
                            }}
                            aria-hidden
                          />
                          {segment.label}
                        </span>
                        <span className="tabular-nums font-medium text-foreground">
                          {segment.count}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {payRuns.length ? `${pct}%` : "—"}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <div className="tito-widget flex flex-1 flex-col gap-3 border-border/60 bg-[linear-gradient(160deg,#ffffff_50%,color-mix(in_srgb,var(--tito-dull-blue)_6%,#ffffff)_100%)] p-5 sm:p-6 dark:bg-card dark:bg-none">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Contribution tables
              </h2>
              <Link
                to="/dashboard/contribution-tables"
                className="text-xs font-medium text-tito-dull-blue hover:underline dark:text-[#9eb6e0]"
              >
                Manage
              </Link>
            </div>
            {isSchedulesPending ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-tito-dull-blue/20 bg-tito-dull-blue/10 text-tito-dull-blue dark:border-tito-dull-blue/35 dark:bg-tito-dull-blue/20 dark:text-[#9eb6e0]">
                  <Table2 className="size-4" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                    {formatCount(activeSchedules)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active · {formatCount(schedules.length)} schedules total
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent pay runs table */}
      <section className="tito-widget overflow-hidden border-border/60" aria-label="Recent pay runs">
        <div className="flex flex-col gap-4 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Recent pay runs
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Latest cutoffs across drafts, computed, and released.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/30 p-1"
              role="tablist"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(filter.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-tito-blue text-white shadow-sm"
                        : "text-muted-foreground hover:bg-tito-dull-blue/10 hover:text-tito-dull-blue dark:hover:text-[#9eb6e0]",
                    )}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            {mayProcess ? (
              <Button asChild size="sm">
                <Link to="/dashboard/pay-runs">
                  <Plus className="size-3.5" />
                  Add pay run
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {isPayRunsPending ? (
          <div className="space-y-3 p-5 sm:p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredRuns.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
            No pay runs in this filter. Create one to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Period</TableHead>
                  <TableHead>Half</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((run) => (
                  <TableRow key={run.id} className="hover:bg-muted/25">
                    <TableCell className="font-medium text-foreground">
                      {formatPayRunPeriod(run.periodStart, run.periodEnd)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cutoffHalfLabel(run.cutoffHalf)}
                    </TableCell>
                    <TableCell>
                      <PayRunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/dashboard/pay-runs/$id"
                          params={{ id: run.id }}
                        >
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
};

const HighlightStat = ({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string | null;
  hint: string;
  to?: string;
}) => {
  const body = (
    <>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      {value == null ? (
        <Skeleton className="mt-1 h-7 w-24" />
      ) : (
        <dd className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </dd>
      )}
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </>
  );

  if (!to) {
    return <div className="payroll-highlight__stat">{body}</div>;
  }

  return (
    <Link
      to={to}
      className="payroll-highlight__stat payroll-highlight__stat--link"
    >
      {body}
    </Link>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      className="size-2 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
    {label}
  </span>
);

const MonthBar = ({
  bucket,
  maxTotal,
}: {
  bucket: MonthBucket;
  maxTotal: number;
}) => {
  const heightPct = Math.max(12, (bucket.total / maxTotal) * 100);
  const parts = (
    [
      { key: "released" as const, value: bucket.released },
      { key: "computed" as const, value: bucket.computed },
      { key: "computing" as const, value: bucket.computing },
      { key: "draft" as const, value: bucket.draft },
    ] satisfies { key: PayRunStatus; value: number }[]
  ).filter((part) => part.value > 0);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
      <div
        className="flex w-full max-w-11 flex-col-reverse overflow-hidden rounded-t-md"
        style={{ height: `${heightPct}%` }}
        title={`${bucket.label}: ${bucket.total} run${bucket.total === 1 ? "" : "s"}`}
      >
        {parts.map((part) => (
          <div
            key={part.key}
            className="w-full"
            style={{
              height: `${(part.value / bucket.total) * 100}%`,
              backgroundColor: STATUS_COLORS[part.key],
              minHeight: 4,
            }}
          />
        ))}
      </div>
      <span className="shrink-0 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {bucket.label}
      </span>
    </div>
  );
};
