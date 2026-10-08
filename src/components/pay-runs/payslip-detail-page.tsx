import { Link } from "@tanstack/react-router";
import { PayslipDocument } from "~/components/pay-runs/payslip-document";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useCurrentUser } from "~/hooks/use-current-user";
import { usePayslip } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";
import { hasPayrollOps } from "~/lib/payroll-access";

type PayslipDetailPageProps = {
  payslipId: string;
};

export const PayslipDetailPage = ({ payslipId }: PayslipDetailPageProps) => {
  const { data: user } = useCurrentUser();
  const isOps = hasPayrollOps(user);
  const { data, isPending, isError, error } = usePayslip(payslipId);
  const payslip = data?.data;
  const backLabel = isOps ? "Payslips" : "My payslips";

  if (isPending) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    );
  }

  const errorMessage =
    error instanceof HrisApiError ? error.message : "Failed to load payslip.";
  const isForbidden =
    error instanceof HrisApiError &&
    (error.status === 403 || error.status === 401);
  const isNotFound = error instanceof HrisApiError && error.status === 404;

  if (isError || !payslip) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 w-fit px-2 text-muted-foreground"
        >
          <Link to="/dashboard/my-payslips">← {backLabel}</Link>
        </Button>
        <p className="text-sm text-destructive" role="alert">
          {isNotFound
            ? "Payslip not found."
            : isForbidden
              ? "You do not have access to this payslip."
              : errorMessage}
        </p>
      </div>
    );
  }

  const employeeName = payslip.employeeName?.trim() || "Payslip";
  const employeeCode = payslip.employeeCode?.trim();

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-muted-foreground print:hidden"
          >
            <Link to="/dashboard/my-payslips">← {backLabel}</Link>
          </Button>
          <h2 className="page-title text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {employeeName}
          </h2>
          {employeeCode ? (
            <p className="text-sm text-muted-foreground">#{employeeCode}</p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 print:hidden"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </Button>
      </header>

      <PayslipDocument payslip={payslip} />
    </div>
  );
};
