import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { employeesService } from "~/api-services/employees.service";
import type { EmployeeListItem } from "~/api-services/employees.types";
import type { CutoffHalf } from "~/api-services/pay-runs.types";
import { PageHeader } from "~/components/layout/page-header";
import {
  cutoffHalfLabel,
  defaultPayPeriod,
  formatPayRunPeriod,
  payPeriodForHalf,
} from "~/components/pay-runs/pay-run-display";
import { PayRunStatusBadge } from "~/components/pay-runs/pay-run-status-badge";
import { PeriodDateRangeField } from "~/components/pay-runs/period-date-range-field";
import { Button } from "~/components/ui/button";
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
import { useCreatePayRun, usePayRuns } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { canProcessPayRuns } from "~/lib/payroll-access";
import { cn } from "~/lib/utils";

const STEPS = [
  { id: "period", label: "Period" },
  { id: "options", label: "Options" },
  { id: "review", label: "Review" },
] as const;

const STEP_REVEAL_DELAY_MS = 520;
const EMPLOYEE_PAGE_SIZE = 200;

const listAllEmployees = async (): Promise<EmployeeListItem[]> => {
  const first = await employeesService.list({
    page: 1,
    limit: EMPLOYEE_PAGE_SIZE,
    sortBy: "name",
    sortDir: "asc",
  });
  const totalPages = Math.max(1, first.meta?.totalPages ?? 1);
  if (totalPages === 1) return first.data ?? [];
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      employeesService.list({
        page: index + 2,
        limit: EMPLOYEE_PAGE_SIZE,
        sortBy: "name",
        sortDir: "asc",
      }),
    ),
  );
  return [first.data, ...rest.map((page) => page.data)].flat();
};

const employeeDisplayName = (employee: EmployeeListItem): string =>
  [employee.firstName, employee.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ") || employee.employeeCode;

const INITIAL_PERIOD = defaultPayPeriod();

const monthAnchorFromPeriod = (start: string, end: string): Date => {
  const preferred = start || end;
  if (preferred) {
    const parsed = parseISO(preferred);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

export const CreatePayRunPage = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const mayProcess = canProcessPayRuns(user);
  const { data } = usePayRuns();
  const create = useCreatePayRun();
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [motion, setMotion] = useState<"idle" | "out">("idle");
  const [hasMoved, setHasMoved] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const [periodStart, setPeriodStart] = useState(INITIAL_PERIOD.start);
  const [periodEnd, setPeriodEnd] = useState(INITIAL_PERIOD.end);
  const [cutoffHalf, setCutoffHalf] = useState<CutoffHalf>(
    INITIAL_PERIOD.cutoffHalf,
  );
  const [includeThirteenthMonth, setIncludeThirteenthMonth] = useState(false);
  const [splitWithholding, setSplitWithholding] = useState(false);
  const [duplicateTriggered, setDuplicateTriggered] = useState(false);
  const employeesQuery = useQuery({
    queryKey: ["employees", "pay-run-preview"],
    queryFn: listAllEmployees,
    enabled: step === STEPS.length - 1 || shown === STEPS.length - 1,
  });

  const runs = data?.data ?? [];
  const current = STEPS[shown] ?? STEPS[0];
  const leaving = motion === "out";
  const destination = STEPS[step] ?? current;
  const showingReview = (leaving ? destination.id : current.id) === "review";
  const periodLabel =
    periodStart && periodEnd
      ? formatPayRunPeriod(periodStart, periodEnd)
      : "Choose both dates";
  const canContinue = Boolean(
    periodStart && periodEnd && periodStart <= periodEnd,
  );
  const duplicateRun = runs.find(
    (run) =>
      (run.kind ?? "regular") === "regular" &&
      run.periodStart === periodStart &&
      run.periodEnd === periodEnd &&
      run.cutoffHalf === cutoffHalf,
  );
  const createError =
    create.error instanceof HrisApiError
      ? create.error.message
      : create.isError
        ? "Failed to create pay run"
        : null;

  useEffect(
    () => () => {
      if (revealTimer.current != null) window.clearTimeout(revealTimer.current);
    },
    [],
  );

  const goTo = (next: number) => {
    if (leaving || next === step || next < 0 || next >= STEPS.length) return;
    if (next > shown && !canContinue) return;
    if (revealTimer.current != null) window.clearTimeout(revealTimer.current);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    setHasMoved(true);
    if (reduce) {
      setShown(next);
      setMotion("idle");
      return;
    }
    setMotion("out");
    revealTimer.current = window.setTimeout(() => {
      setShown(next);
      setMotion("idle");
      revealTimer.current = null;
    }, STEP_REVEAL_DELAY_MS);
  };

  const handleCutoffHalfChange = (value: CutoffHalf) => {
    setCutoffHalf(value);
    setDuplicateTriggered(false);
    create.reset();
    const anchor = monthAnchorFromPeriod(periodStart, periodEnd);
    const next = payPeriodForHalf(
      anchor.getFullYear(),
      anchor.getMonth(),
      value,
    );
    setPeriodStart(next.start);
    setPeriodEnd(next.end);
  };

  const handleCreate = () => {
    if (!canContinue) return;
    if (duplicateRun) {
      setDuplicateTriggered(true);
      return;
    }
    setDuplicateTriggered(false);
    create.mutate(
      {
        periodStart,
        periodEnd,
        cutoffHalf,
        includeThirteenthMonth,
        splitWithholding,
      },
      {
        onSuccess: (result) => {
          const id = result.data?.id;
          if (id) {
            void navigate({
              to: "/dashboard/pay-runs/$id",
              params: { id },
            });
            return;
          }
          void navigate({ to: "/dashboard/pay-runs" });
        },
      },
    );
  };

  if (!mayProcess) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <PageHeader
          title="Create pay run"
          description="Processing is limited to HR and finance."
        />
        <Button asChild variant="outline" className="w-fit">
          <Link to="/dashboard/pay-runs">Back to pay runs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit px-0">
          <Link to="/dashboard/pay-runs">
            <ArrowLeft className="size-4" />
            Pay runs
          </Link>
        </Button>
        <PageHeader
          title="Create pay run"
          description="Set the cutoff, then review every employee before you create the draft."
        />
      </div>

      <ol className="grid grid-cols-3 gap-2" aria-label="Create pay run steps">
        {STEPS.map((item, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => goTo(index)}
                disabled={leaving || (index > step && !canContinue)}
                aria-current={active ? "step" : undefined}
                className="flex w-full flex-col items-start gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="h-1 w-full overflow-hidden rounded-full bg-border">
                  <span
                    className="pay-run-step-fill block h-full w-full bg-tito-green"
                    data-on={done || active ? "true" : "false"}
                  />
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "pay-run-step-index flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                      active
                        ? "bg-tito-blue text-white"
                        : done
                          ? "bg-tito-green text-tito-dark-green"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {showingReview ? (
        <div
          key={leaving ? "review-loading" : "review"}
          className="pay-run-step-pane"
          data-enter={hasMoved && !leaving ? "true" : "false"}
          data-motion="idle"
          data-direction={direction}
          aria-busy={leaving}
        >
          {leaving ? (
            <StepSkeleton kind="table" />
          ) : (
            <ExpectedPayRunTable
              periodLabel={periodLabel}
              cutoffHalf={cutoffHalf}
              includeThirteenthMonth={includeThirteenthMonth}
              splitWithholding={splitWithholding}
              employees={employeesQuery.data ?? []}
              pending={employeesQuery.isPending}
              error={
                employeesQuery.isError ? "Failed to load employees." : null
              }
              duplicateMessage={
                duplicateTriggered && duplicateRun
                  ? `A pay run already exists for ${periodLabel} (${cutoffHalfLabel(cutoffHalf)}).`
                  : null
              }
              createError={createError}
              creating={create.isPending}
              createDisabled={create.isPending || !canContinue}
              backDisabled={create.isPending}
              onBack={() => goTo(step - 1)}
              onCreate={handleCreate}
            />
          )}
        </div>
      ) : (
        <section
          className="rounded-xl border border-border/40 bg-card p-5 shadow-sm sm:p-6"
          aria-labelledby="create-step-title"
        >
          <div
            key={leaving ? "loading" : current.id}
            className="pay-run-step-pane"
            data-enter={hasMoved && !leaving ? "true" : "false"}
            data-motion="idle"
            data-direction={direction}
            aria-busy={leaving}
          >
            {leaving ? <StepSkeleton kind="form" /> : null}
            {!leaving && current.id === "period" ? (
              <PeriodStep
                periodStart={periodStart}
                periodEnd={periodEnd}
                cutoffHalf={cutoffHalf}
                disabled={create.isPending}
                onPeriodChange={(next) => {
                  setPeriodStart(next.start);
                  setPeriodEnd(next.end);
                  setDuplicateTriggered(false);
                  create.reset();
                }}
                onCutoffChange={handleCutoffHalfChange}
              />
            ) : null}
            {!leaving && current.id === "options" ? (
              <OptionsStep
                includeThirteenthMonth={includeThirteenthMonth}
                splitWithholding={splitWithholding}
                disabled={create.isPending}
                onThirteenth={setIncludeThirteenthMonth}
                onSplit={setSplitWithholding}
              />
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => goTo(step - 1)}
              disabled={step === 0 || create.isPending || leaving}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => goTo(step + 1)}
              disabled={!canContinue || create.isPending || leaving}
            >
              Continue
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

const PeriodStep = ({
  periodStart,
  periodEnd,
  cutoffHalf,
  disabled,
  onPeriodChange,
  onCutoffChange,
}: {
  periodStart: string;
  periodEnd: string;
  cutoffHalf: CutoffHalf;
  disabled: boolean;
  onPeriodChange: (next: { start: string; end: string }) => void;
  onCutoffChange: (value: CutoffHalf) => void;
}) => (
  <div className="space-y-5">
    <div>
      <h2 id="create-step-title" className="text-lg font-semibold">
        Period
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick the cutoff half. That sets the dates Clock hours are pulled from.
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <HalfChoice
        selected={cutoffHalf === "first"}
        title="1st half"
        detail="Days 1–15. HDMF and PhilHealth."
        disabled={disabled}
        onSelect={() => onCutoffChange("first")}
      />
      <HalfChoice
        selected={cutoffHalf === "second"}
        title="2nd half"
        detail="Day 16 through month end. SSS."
        disabled={disabled}
        onSelect={() => onCutoffChange("second")}
      />
    </div>
    <PeriodDateRangeField
      id="pay-run-period"
      value={{ start: periodStart, end: periodEnd }}
      onChange={onPeriodChange}
      disabled={disabled}
      className="w-full sm:max-w-md"
    />
  </div>
);

const HalfChoice = ({
  selected,
  title,
  detail,
  disabled,
  onSelect,
}: {
  selected: boolean;
  title: string;
  detail: string;
  disabled: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    disabled={disabled}
    aria-pressed={selected}
    className={cn(
      "rounded-xl border p-4 text-left transition-colors",
      selected
        ? "border-tito-green bg-[color-mix(in_srgb,var(--tito-green)_16%,var(--card))]"
        : "border-border/70 bg-card hover:bg-muted/40",
    )}
  >
    <span className="block text-sm font-semibold">{title}</span>
    <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
  </button>
);

const OptionsStep = ({
  includeThirteenthMonth,
  splitWithholding,
  disabled,
  onThirteenth,
  onSplit,
}: {
  includeThirteenthMonth: boolean;
  splitWithholding: boolean;
  disabled: boolean;
  onThirteenth: (value: boolean) => void;
  onSplit: (value: boolean) => void;
}) => (
  <div className="space-y-4">
    <div>
      <h2 id="create-step-title" className="text-lg font-semibold">
        Options
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Both stay off unless this cutoff needs them.
      </p>
    </div>
    <OptionToggle
      id="include-thirteenth-month"
      checked={includeThirteenthMonth}
      disabled={disabled}
      title="Include 13th month pay"
      detail="Compute adds 1/12 of year-to-date basic pay. Consultants stay at 0. Use once a year."
      onChange={onThirteenth}
    />
    <OptionToggle
      id="split-withholding"
      checked={splitWithholding}
      disabled={disabled}
      title="Split monthly withholding"
      detail="Off deducts the full monthly tax on this cutoff. On splits it, with the remainder on the 2nd half."
      onChange={onSplit}
    />
  </div>
);

const OptionToggle = ({
  id,
  checked,
  disabled,
  title,
  detail,
  onChange,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  title: string;
  detail: string;
  onChange: (value: boolean) => void;
}) => (
  <label
    htmlFor={id}
    className={cn(
      "flex cursor-pointer gap-3 rounded-xl border p-4",
      checked
        ? "border-tito-green bg-[color-mix(in_srgb,var(--tito-green)_12%,var(--card))]"
        : "border-border/70",
    )}
  >
    <input
      id={id}
      type="checkbox"
      className="mt-1 size-4 shrink-0 rounded border border-input"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
    </span>
  </label>
);

const previewColumns = (
  cutoffHalf: CutoffHalf,
  includeThirteenthMonth: boolean,
  splitWithholding: boolean,
): { label: string; value: string; money?: boolean }[] => {
  const onFirstHalf = cutoffHalf === "first";
  return [
    { label: "Hours", value: "—", money: true },
    { label: "Basic", value: "—", money: true },
    {
      label: "13th month",
      value: includeThirteenthMonth ? "1/12 of YTD basic" : "—",
      money: true,
    },
    { label: "HDMF", value: onFirstHalf ? "This half" : "—", money: true },
    { label: "PhilHealth", value: onFirstHalf ? "This half" : "—", money: true },
    { label: "SSS", value: onFirstHalf ? "—" : "This half", money: true },
    { label: "WHT", value: splitWithholding ? "Split" : "Full", money: true },
    { label: "Net", value: "—", money: true },
  ];
};

const ExpectedPayRunTable = ({
  periodLabel,
  cutoffHalf,
  includeThirteenthMonth,
  splitWithholding,
  employees,
  pending,
  error,
  duplicateMessage,
  createError,
  creating,
  createDisabled,
  backDisabled,
  onBack,
  onCreate,
}: {
  periodLabel: string;
  cutoffHalf: CutoffHalf;
  includeThirteenthMonth: boolean;
  splitWithholding: boolean;
  employees: EmployeeListItem[];
  pending: boolean;
  error: string | null;
  duplicateMessage: string | null;
  createError: string | null;
  creating: boolean;
  createDisabled: boolean;
  backDisabled: boolean;
  onBack: () => void;
  onCreate: () => void;
}) => {
  const amounts = previewColumns(
    cutoffHalf,
    includeThirteenthMonth,
    splitWithholding,
  );
  const countLabel = pending
    ? "Loading employees"
    : `${employees.length} employee${employees.length === 1 ? "" : "s"}`;

  return (
    <section
      className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm"
      aria-labelledby="create-step-title"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 px-5 py-4">
        <div className="min-w-0">
          <h2 id="create-step-title" className="text-lg font-semibold">
            Review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodLabel}
            <span className="px-1.5">·</span>
            {cutoffHalfLabel(cutoffHalf, { withFunds: true })}
            <span className="px-1.5">·</span>
            {countLabel}. Amounts stay blank until you compute.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PayRunStatusBadge status="draft" />
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={backDisabled}
          >
            Back
          </Button>
          <Button type="button" onClick={onCreate} disabled={createDisabled}>
            {creating ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </div>
      {duplicateMessage ? (
        <p className="px-5 pt-4 text-sm text-destructive" role="alert">
          {duplicateMessage}
        </p>
      ) : null}
      {createError ? (
        <p className="px-5 pt-4 text-sm text-destructive" role="alert">
          {createError}
        </p>
      ) : null}
      <Table empty={!pending && employees.length === 0} className="min-w-[52rem]">
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            {amounts.map((cell) => (
              <TableHead
                key={cell.label}
                className={cell.money ? "text-right" : undefined}
              >
                {cell.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pending ? (
            Array.from({ length: 8 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </TableCell>
                {amounts.map((cell) => (
                  <TableCell key={cell.label} className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={amounts.length + 1}
                className="py-8 text-center text-destructive"
              >
                {error}
              </TableCell>
            </TableRow>
          ) : employees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={amounts.length + 1}
                className="py-8 text-center text-muted-foreground"
              >
                No employees yet.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>
                  <span className="block font-medium">
                    {employeeDisplayName(employee)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {employee.employeeCode}
                  </span>
                </TableCell>
                {amounts.map((cell) => (
                  <TableCell
                    key={cell.label}
                    className="text-right tabular-nums"
                  >
                    {cell.value}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
};

const StepSkeleton = ({ kind }: { kind: "form" | "table" }) => {
  if (kind === "table") {
    return (
      <div
        className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border/40 px-5 py-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-64 max-w-full" />
    </div>
  );
};
