import { Link } from "@tanstack/react-router";
import { useMyPayslips } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export const MyPayslipsPage = () => {
  const { data, isPending, isError, error } = useMyPayslips();
  const payslips = data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">My payslips</h2>
        <p className="text-sm text-muted-foreground">
          Released cutoffs only. Open a row to view or print the paper payslip.
        </p>
      </div>

      {isPending ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof HrisApiError
            ? error.message
            : "Failed to load payslips"}
        </p>
      ) : null}

      {!isPending && !isError ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-[40rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Half</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No released payslips yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payslips.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      <TableCell className="tabular-nums">
                        <Link
                          to="/dashboard/my-payslips/$id"
                          params={{ id: row.id }}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {row.periodStart} → {row.periodEnd}
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize">
                        {row.cutoffHalf}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.grossPay}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {row.totalDeductions}
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {row.netPay}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
