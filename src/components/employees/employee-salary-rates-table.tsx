import type { ReactNode } from "react";
import type { PayrollSalaryRate } from "~/api-services/salary-rates.types";
import {
  formatPayRunDate,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import { Badge } from "~/components/ui/badge";
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
import { useCurrentUser } from "~/hooks/use-current-user";
import { HrisApiError } from "~/lib/hris-api-client";
import { canViewEmployeeSalaryRates } from "~/lib/payroll-access";
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

type EmployeeSalaryRatesTableProps = {
  employeeId: string;
  className?: string;
};

export const EmployeeSalaryRatesTable = ({
  employeeId,
  className,
}: EmployeeSalaryRatesTableProps) => {
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const canView = canViewEmployeeSalaryRates(user);

  const { data, isPending, isError, error } = useEmployeeSalaryRates(
    employeeId,
    { enabled: Boolean(employeeId) && canView },
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

  const rates = data?.data.rates ?? [];

  if (isUserPending) {
    return null;
  }

  if (!canView || (isError && forbidden)) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="gap-1 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Rate history</CardTitle>
            <CardDescription>Newest first.</CardDescription>
          </div>
          {!isPending && !isError ? (
            <TableColumnVisibility
              columns={columns}
              labelById={labelById}
              onChange={setColumns}
              lockedHint="From stays fixed."
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div
            className="space-y-3"
            role="status"
            aria-label="Loading salary rates"
          >
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        ) : null}

        {!isPending && isError ? (
          <p className="text-sm text-muted-foreground" role="status">
            {noLinkedUser
              ? "Link an account before viewing salary rates."
              : error instanceof HrisApiError
                ? error.message
                : "Salary rates unavailable."}
          </p>
        ) : null}

        {!isPending && !isError ? (
          rates.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              No salary rates yet.
            </p>
          ) : (
            <div className="-mx-6 overflow-x-auto sm:mx-0">
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
          )
        ) : null}
      </CardContent>
    </Card>
  );
};
