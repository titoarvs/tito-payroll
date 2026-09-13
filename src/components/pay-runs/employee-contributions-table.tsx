import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_EMPLOYEE_PAGE_SIZE,
  EmployeeListPagination,
  type EmployeePageSize,
} from "~/components/employees/employee-list-pagination";
import { formatPayslipMoney } from "~/components/pay-runs/pay-run-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useEmployeeContributions } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { cn } from "~/lib/utils";

const coveredAmount = (
  amount: string,
  covered: boolean,
  isConsultant: boolean,
): string => {
  if (isConsultant || !covered) return "—";
  return formatPayslipMoney(amount);
};

export const EmployeeContributionsTable = () => {
  const { data, isPending, isError, error } = useEmployeeContributions();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<EmployeePageSize>(
    DEFAULT_EMPLOYEE_PAGE_SIZE,
  );
  const rows = data?.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.firstName,
        row.lastName,
        row.employeeCode,
        row.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <Card aria-label="Employee contributions" className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Employee contributions</CardTitle>
            <CardDescription>
              Active employees with SSS / HDMF / PhilHealth employee share from
              current brackets (by monthly salary).
            </CardDescription>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees"
            className="sm:max-w-xs"
            aria-label="Search employees"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <div className="px-6 pb-4">
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : null}

          {isError ? (
            <p className="text-sm text-destructive" role="alert">
              {error instanceof HrisApiError
                ? error.message
                : "Failed to load employee contributions"}
            </p>
          ) : null}

          {!isPending && !isError && filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              {rows.length === 0
                ? "No active employees found."
                : "No employees match this search."}
            </p>
          ) : null}
        </div>

        {!isPending && !isError && filtered.length > 0 ? (
          <>
            <div className="overflow-x-auto border-t border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Monthly salary</TableHead>
                    <TableHead className="text-right">SSS</TableHead>
                    <TableHead className="text-right">HDMF</TableHead>
                    <TableHead className="text-right">PhilHealth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => {
                    const name = [row.firstName, row.lastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim();
                    const isConsultant =
                      row.employmentStatus === "consultant";
                    return (
                      <TableRow key={row.id} className="hover:bg-muted/25">
                        <TableCell>
                          <Link
                            to="/dashboard/employees/$id"
                            params={{ id: row.id }}
                            className={cn(
                              "block min-w-0 rounded-md outline-none",
                              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            )}
                            aria-label={`View ${name}`}
                          >
                            <p className="truncate font-medium text-foreground underline-offset-4 hover:underline">
                              {name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              <span className="font-mono">
                                {row.employeeCode}
                              </span>
                              {row.department?.trim()
                                ? ` · ${row.department.trim()}`
                                : ""}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums",
                            !row.monthlySalary && "text-muted-foreground",
                          )}
                        >
                          {formatPayslipMoney(row.monthlySalary)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {coveredAmount(
                            row.sss,
                            row.sssCovered,
                            isConsultant,
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {coveredAmount(
                            row.hdmf,
                            row.pagibigCovered,
                            isConsultant,
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {coveredAmount(
                            row.philhealth,
                            row.philhealthCovered,
                            isConsultant,
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <EmployeeListPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              isLoading={isPending}
              itemLabel="employees"
              pageSizeSelectId="contribution-employee-page-size"
              onPreviousPage={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              onNextPage={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              onPageSizeChange={setPageSize}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};
