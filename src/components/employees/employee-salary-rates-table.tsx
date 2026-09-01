import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { PayrollSalaryRate } from "~/api-services/salary-rates.types";
import {
  formatPayRunDate,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { useEmployeeSalaryRates } from "~/hooks/use-salary-rates";
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

/** Shared with salary-rates Rate history so prefs stay in sync. */
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

type EmployeeSalaryRatesTableProps = {
  employeeId: string;
  className?: string;
};

export const EmployeeSalaryRatesTable = ({
  employeeId,
  className,
}: EmployeeSalaryRatesTableProps) => {
  const { data, isPending, isError, error } = useEmployeeSalaryRates(
    employeeId,
    { enabled: Boolean(employeeId) },
  );
  const { columns, setColumns, visibleIds, labelById } = useTableColumns(
    SALARY_RATE_HISTORY_COLUMNS_STORAGE_KEY,
    SALARY_RATE_HISTORY_COLUMN_DEFS,
  );

  const forbidden =
    error instanceof HrisApiError &&
    (error.status === 401 || error.status === 403);
  const noLinkedUser =
    error instanceof HrisApiError &&
    error.status === 400 &&
    /linked account/i.test(error.message);

  if (isError && forbidden) {
    return null;
  }

  const rates = data?.data.rates ?? [];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">Salary rate history</CardTitle>
          <CardDescription>
            Clock history for this employee. Newest first — change pay from
            Salary rates.
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <TableColumnVisibility
            columns={columns}
            labelById={labelById}
            onChange={setColumns}
            lockedHint="From stays fixed."
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1 active:scale-[0.97] motion-reduce:active:scale-100"
          >
            <Link to="/dashboard/salary-rates" search={{ employeeId }}>
              Manage rates
              <ChevronRightIcon className="size-3.5 opacity-60" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isPending ? (
          <div
            className="space-y-2 px-6 pb-6"
            role="status"
            aria-label="Loading salary rates"
          >
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-3/4" />
          </div>
        ) : null}

        {!isPending && isError ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground" role="status">
            {noLinkedUser
              ? "Link an account before viewing salary rates."
              : error instanceof HrisApiError
                ? error.message
                : "Salary rate history unavailable."}
          </p>
        ) : null}

        {!isPending && !isError && rates.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground" role="status">
            No salary rates yet.
          </p>
        ) : null}

        {!isPending && !isError && rates.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  {visibleIds.map((id) => (
                    <TableHead key={id}>{labelById[id]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatPayRunDate(rate.effectiveFrom)}
                    </TableCell>
                    {visibleIds.map((id) =>
                      renderSalaryRateHistoryCell(id, rate),
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
