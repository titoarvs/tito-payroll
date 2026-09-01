import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PayrollSalaryRate } from "~/api-services/salary-rates.types";
import {
  initialsFrom,
  isHttpImage,
} from "~/components/employees/employee-display";

import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import { PageHeader } from "~/components/layout/page-header";
import {
  formatPayRunDate,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import {
  deriveHourlyFromMonthly,
  displayEmployeeName,
  monthlyAllowanceFromCutoff,
} from "~/components/salary-rates/salary-rate-display";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  TableColumnVisibility,
  useTableColumns,
  type TableColumnDef,
} from "~/components/ui/table-column-visibility";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { useEmployees } from "~/hooks/use-employees";
import {
  useCreateEmployeeSalaryRate,
  useEmployeeSalaryRates,
} from "~/hooks/use-salary-rates";
import { HrisApiError } from "~/lib/hris-api-client";
import { cn } from "~/lib/utils";

type SalaryRateHistoryColumnId = "to" | "monthly" | "hourly" | "status";

const SALARY_RATE_HISTORY_COLUMN_DEFS: TableColumnDef<SalaryRateHistoryColumnId>[] =
  [
    { id: "to", label: "To" },
    { id: "monthly", label: "Monthly" },
    { id: "hourly", label: "Hourly" },
    { id: "status", label: "Status" },
  ];

const SALARY_RATE_HISTORY_COLUMNS_STORAGE_KEY =
  "payroll.salary-rates-history.tableColumns.v1";

const renderSalaryRateHistoryCell = (
  id: SalaryRateHistoryColumnId,
  rate: PayrollSalaryRate,
): ReactNode => {
  switch (id) {
    case "to":
      return (
        <TableCell key={id} className="whitespace-nowrap text-xs">
          {formatPayRunDate(rate.effectiveTo)}
        </TableCell>
      );
    case "monthly":
      return (
        <TableCell key={id} className="tabular-nums text-sm font-medium">
          {formatPayslipMoney(rate.monthlySalary)}
        </TableCell>
      );
    case "hourly":
      return (
        <TableCell key={id} className="tabular-nums text-sm">
          {formatPayslipMoney(rate.hourlyRate)}
        </TableCell>
      );
    case "status":
      return (
        <TableCell key={id}>
          {rate.isActive ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Inactive</span>
          )}
        </TableCell>
      );
  }
};

const todayIsoDate = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const MONEY_RE = /^\d+(\.\d{1,2})?$/;

export const SalaryRatesPage = () => {
  const navigate = useNavigate({ from: "/dashboard/salary-rates" });
  const search = useSearch({ from: "/dashboard/salary-rates" });
  const employeeIdFromUrl =
    typeof search.employeeId === "string" ? search.employeeId : "";

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [selectedId, setSelectedId] = useState(employeeIdFromUrl);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<EmployeePageSize>(
    DEFAULT_EMPLOYEE_PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const employeesQuery = useEmployees({
    search: debouncedSearch || undefined,
    page,
    limit: pageSize,
    sortBy: "name",
    sortDir: "asc",
  });
  const employees = employeesQuery.data?.data ?? [];
  const listTotal = employeesQuery.data?.meta.total ?? 0;
  const listTotalPages = Math.max(1, employeesQuery.data?.meta.totalPages ?? 1);
  const listLoading = employeesQuery.isPending || employeesQuery.isFetching;

  const ratesQuery = useEmployeeSalaryRates(selectedId, {
    enabled: Boolean(selectedId),
  });
  const createRate = useCreateEmployeeSalaryRate(selectedId);
  const {
    columns: historyColumns,
    setColumns: setHistoryColumns,
    visibleIds: historyVisibleIds,
    labelById: historyLabelById,
  } = useTableColumns(
    SALARY_RATE_HISTORY_COLUMNS_STORAGE_KEY,
    SALARY_RATE_HISTORY_COLUMN_DEFS,
  );

  const [monthlySalary, setMonthlySalary] = useState("");
  const [allowance, setAllowance] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate);
  const [effectiveTo, setEffectiveTo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const seededForKey = useRef<string>("");
  const hourlyRate = deriveHourlyFromMonthly(monthlySalary);

  const selectEmployee = (id: string) => {
    setSelectedId(id);
    setFormError(null);
    void navigate({
      search: (prev) => ({ ...prev, employeeId: id }),
      replace: true,
    });
  };

  useEffect(() => {
    if (employeeIdFromUrl && employeeIdFromUrl !== selectedId) {
      setSelectedId(employeeIdFromUrl);
    }
  }, [employeeIdFromUrl, selectedId]);

  useEffect(() => {
    const firstId = employees[0]?.id;
    if (!selectedId && !employeeIdFromUrl && firstId) {
      setSelectedId(firstId);
      void navigate({
        search: (prev) => ({ ...prev, employeeId: firstId }),
        replace: true,
      });
    }
  }, [employees, selectedId, employeeIdFromUrl, navigate]);

  useEffect(() => {
    if (!selectedId) {
      seededForKey.current = "";
      setMonthlySalary("");
      setAllowance("");
      setEffectiveFrom(todayIsoDate());
      setEffectiveTo("");
      setFormError(null);
      return;
    }

    if (ratesQuery.isPending) return;

    const seedKey = `${selectedId}:${ratesQuery.dataUpdatedAt}:${ratesQuery.isError ? "err" : "ok"}`;
    if (seededForKey.current === seedKey) return;
    seededForKey.current = seedKey;

    if (ratesQuery.isError) {
      setMonthlySalary("");
      setAllowance("");
      setEffectiveFrom(todayIsoDate());
      setEffectiveTo("");
      setFormError(null);
      return;
    }

    const emp = ratesQuery.data?.data.employee;
    setMonthlySalary(emp?.salary?.trim() || "");
    setAllowance(emp?.allowance?.trim() || "");
    setEffectiveFrom(todayIsoDate());
    setEffectiveTo("");
    setFormError(null);
  }, [
    selectedId,
    ratesQuery.isPending,
    ratesQuery.isError,
    ratesQuery.dataUpdatedAt,
    ratesQuery.data?.data.employee,
  ]);

  const payload = ratesQuery.data?.data;
  const employee = payload?.employee;
  const rates = payload?.rates ?? [];
  const active = rates.find((r) => r.isActive) ?? rates[0] ?? null;

  const selectedListRow = employees.find((e) => e.id === selectedId);

  const validateForm = (): string | null => {
    const monthly = monthlySalary.replace(/,/g, "").trim();
    const hourly = hourlyRate.replace(/,/g, "").trim();
    if (!MONEY_RE.test(monthly)) {
      return "Enter a valid monthly salary (e.g. 50000.00).";
    }
    if (!MONEY_RE.test(hourly)) {
      return "Enter a valid hourly rate (derived from monthly).";
    }
    if (allowance.trim()) {
      const a = allowance.replace(/,/g, "").trim();
      if (!MONEY_RE.test(a)) {
        return "Enter a valid allowance or leave it blank.";
      }
    }
    if (!effectiveFrom) {
      return "Effective from date is required.";
    }
    if (effectiveTo && effectiveTo < effectiveFrom) {
      return "Effective to must be on or after effective from.";
    }
    return null;
  };

  const applyPaySeed = (seed?: {
    monthly?: string | null;
    allowance?: string | null;
  }) => {
    setMonthlySalary(seed?.monthly?.trim() || "");
    setAllowance(seed?.allowance?.trim() || "");
    setEffectiveFrom(todayIsoDate());
    setEffectiveTo("");
    setFormError(null);
  };

  const handleSave = () => {
    if (!selectedId) return;
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    createRate.mutate({
      monthlySalary: monthlySalary.replace(/,/g, "").trim(),
      hourlyRate: hourlyRate.replace(/,/g, "").trim(),
      allowance: allowance.replace(/,/g, "").trim() || null,
      effectiveFrom,
      effectiveTo: effectiveTo.trim() || null,
    });
  };

  const ratesErrorMessage =
    ratesQuery.error instanceof HrisApiError
      ? ratesQuery.error.message
      : "Failed to load salary rates.";
  const noLinkedUser =
    ratesQuery.error instanceof HrisApiError &&
    ratesQuery.error.status === 400 &&
    /linked account/i.test(ratesQuery.error.message);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-5">
      <PageHeader
        className="shrink-0"
        title="Salary rates"
        description="Enter monthly salary, hourly rate, and optional allowance. Saving creates Clock history and syncs the active rate for pay runs."
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Employee picker */}
        <Card className="flex min-h-0 flex-col overflow-hidden lg:col-span-4">
          <CardHeader className="shrink-0 space-y-3 border-b border-border/40 pb-4">
            <div>
              <CardTitle className="text-base">Employees</CardTitle>
              <CardDescription>
                Select who to update. Linked accounts only for saving rates.
              </CardDescription>
            </div>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Label htmlFor="salary-rate-search" className="sr-only">
                Search employees
              </Label>
              <Input
                id="salary-rate-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or ID"
                className="h-9 pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {employeesQuery.isPending ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: pageSize }, (_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : null}

              {!employeesQuery.isPending && employees.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No employees match your search.
                </p>
              ) : null}

              <ul
                className="divide-y divide-border/40"
                role="listbox"
                aria-label="Employees"
              >
                {employees.map((row) => {
                  const selected = row.id === selectedId;
                  const name = displayEmployeeName(
                    row.firstName,
                    row.lastName,
                  );
                  const code = row.employeeCode?.trim() || "—";
                  const meta = [
                    row.position?.trim(),
                    row.department?.trim(),
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  const photoUrl = isHttpImage(row.userImage)
                    ? row.userImage
                    : null;

                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-label={
                          meta
                            ? `${name}, ${code}, ${meta}`
                            : `${name}, ${code}`
                        }
                        onClick={() => selectEmployee(row.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                          "active:scale-[0.99] motion-reduce:active:scale-100",
                          selected
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <div
                          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted text-[10px] font-medium tracking-wide text-muted-foreground"
                          aria-hidden
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <span>{initialsFrom(name)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium tracking-tight text-foreground">
                            {name}
                          </span>
                          <span className="mt-0.5 flex min-w-0 items-baseline gap-1.5 text-[11px] leading-tight text-muted-foreground">
                            <span className="shrink-0 font-mono tabular-nums">
                              {code}
                            </span>
                            {meta ? (
                              <>
                                <span
                                  className="text-border"
                                  aria-hidden
                                >
                                  ·
                                </span>
                                <span className="min-w-0 truncate">{meta}</span>
                              </>
                            ) : null}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <EmployeeListPagination
              compact
              className="shrink-0"
              page={page}
              totalPages={listTotalPages}
              total={listTotal}
              pageSize={pageSize}
              isLoading={listLoading}
              pageSizeSelectId="salary-rates-employee-page-size"
              onPreviousPage={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              onNextPage={() =>
                setPage((current) => Math.min(listTotalPages, current + 1))
              }
              onPageSizeChange={setPageSize}
            />
          </CardContent>
        </Card>

        {/* Entry panel */}
        <div className="flex min-h-0 flex-col gap-4 lg:col-span-8">
          {!selectedId ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Select an employee to enter a salary rate.
              </CardContent>
            </Card>
          ) : null}

          {selectedId && ratesQuery.isPending ? (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : null}

          {selectedId && ratesQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedListRow
                    ? displayEmployeeName(
                        selectedListRow.firstName,
                        selectedListRow.lastName,
                        selectedListRow.employeeCode,
                      )
                    : "Employee"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive" role="alert">
                  {noLinkedUser
                    ? "This employee has no linked account. Link a user in HRIS before setting rates."
                    : ratesErrorMessage}
                </p>
                {selectedListRow ? (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link
                      to="/dashboard/employees/$id"
                      params={{ id: selectedListRow.id }}
                    >
                      Open employee profile
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {selectedId &&
          !ratesQuery.isPending &&
          !ratesQuery.isError &&
          employee ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {displayEmployeeName(
                          employee.firstName,
                          employee.lastName,
                          employee.employeeCode,
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {employee.department?.trim() || "No department"}
                        {" · "}
                        Current pay used by compute
                      </CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link
                        to="/dashboard/employees/$id"
                        params={{ id: employee.id }}
                      >
                        View profile
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryItem
                    label="Monthly"
                    value={formatPayslipMoney(employee.salary)}
                  />
                  <SummaryItem
                    label="Hourly"
                    value={formatPayslipMoney(employee.hourlyRate)}
                  />
                  <SummaryItem
                    label="Allowance / month"
                    value={formatPayslipMoney(
                      employee.allowance
                        ? monthlyAllowanceFromCutoff(employee.allowance) ||
                            employee.allowance
                        : null,
                    )}
                  />
                  <SummaryItem
                    label="Active from"
                    value={
                      active ? formatPayRunDate(active.effectiveFrom) : "—"
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Enter new rate</CardTitle>
                  <CardDescription>
                    Required: monthly salary and effective from. Hourly is
                    computed as monthly ÷ 22 ÷ 8. Prior active rates become
                    inactive on save.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      id="monthly-salary"
                      label="Monthly salary"
                      required
                    >
                      <Input
                        id="monthly-salary"
                        inputMode="decimal"
                        value={monthlySalary}
                        onChange={(e) => {
                          setMonthlySalary(e.target.value);
                          setFormError(null);
                        }}
                        placeholder="50000.00"
                        autoComplete="off"
                      />
                    </Field>
                    <Field id="hourly-rate" label="Hourly rate" required>
                      <Input
                        id="hourly-rate"
                        inputMode="decimal"
                        value={hourlyRate}
                        disabled
                        readOnly
                        placeholder="284.09"
                        autoComplete="off"
                        aria-describedby="hourly-rate-hint"
                      />
                      <span id="hourly-rate-hint" className="sr-only">
                        Auto-computed from monthly salary divided by 22 then by
                        8
                      </span>
                    </Field>
                    <Field id="allowance" label="Allowance per cutoff">
                      <Input
                        id="allowance"
                        inputMode="decimal"
                        value={allowance}
                        onChange={(e) => {
                          setAllowance(e.target.value);
                          setFormError(null);
                        }}
                        placeholder="0.00"
                        autoComplete="off"
                      />
                    </Field>
                    <Field
                      id="effective-from"
                      label="Effective from"
                      required
                    >
                      <Input
                        id="effective-from"
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => {
                          setEffectiveFrom(e.target.value);
                          setFormError(null);
                        }}
                      />
                    </Field>
                    <Field id="effective-to" label="Effective to">
                      <Input
                        id="effective-to"
                        type="date"
                        value={effectiveTo}
                        onChange={(e) => {
                          setEffectiveTo(e.target.value);
                          setFormError(null);
                        }}
                      />
                    </Field>
                  </div>

                  {formError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={createRate.isPending}
                      className="active:scale-[0.97] motion-reduce:active:scale-100"
                    >
                      {createRate.isPending ? "Saving…" : "Save rate"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={createRate.isPending}
                      onClick={() =>
                        applyPaySeed({
                          monthly: employee.salary,
                          allowance: employee.allowance,
                        })
                      }
                    >
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base">Rate history</CardTitle>
                    <CardDescription>
                      Newest first. Add a new rate to change pay — rows are not
                      edited in place.
                    </CardDescription>
                  </div>
                  <TableColumnVisibility
                    columns={historyColumns}
                    labelById={historyLabelById}
                    onChange={setHistoryColumns}
                    lockedHint="From stays fixed."
                  />
                </CardHeader>
                <CardContent className="p-0">
                  {rates.length === 0 ? (
                    <p className="px-6 pb-6 text-sm text-muted-foreground">
                      No salary rates yet. Enter the first rate above.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>From</TableHead>
                            {historyVisibleIds.map((id) => (
                              <TableHead key={id}>
                                {historyLabelById[id]}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rates.map((rate) => (
                            <TableRow key={rate.id}>
                              <TableCell className="whitespace-nowrap text-xs">
                                {formatPayRunDate(rate.effectiveFrom)}
                              </TableCell>
                              {historyVisibleIds.map((id) =>
                                renderSalaryRateHistoryCell(id, rate),
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Field = ({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>
      {label}
      {required ? (
        <span className="text-destructive" aria-hidden>
          {" "}
          *
        </span>
      ) : null}
    </Label>
    {children}
    {hint ? (
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

const SummaryItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="min-w-0 rounded-lg border border-border/40 bg-muted/25 px-3 py-2.5">
    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">
      {value}
    </p>
  </div>
);
