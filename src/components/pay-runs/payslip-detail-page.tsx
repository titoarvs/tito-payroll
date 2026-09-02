import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, DownloadIcon, PrinterIcon } from "lucide-react";
import { PayslipView } from "~/components/pay-runs/payslip-view";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { usePayslip } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

type PayslipDetailPageProps = {
  payslipId: string;
};

export const PayslipDetailPage = ({ payslipId }: PayslipDetailPageProps) => {
  const { data, isPending, isError, error } = usePayslip(payslipId);

  const errorMessage =
    error instanceof HrisApiError ? error.message : "Failed to load payslip.";
  const isForbidden =
    error instanceof HrisApiError &&
    (error.status === 403 || error.status === 401);
  const isNotFound = error instanceof HrisApiError && error.status === 404;
  const payslip = data?.data;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/dashboard/my-payslips"
            className="mb-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4 shrink-0" />
            Back
          </Link>
          <h1 className="page-title text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Payslip details
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            disabled={!payslip}
            onClick={() => window.print()}
          >
            <PrinterIcon className="size-3.5 sm:size-4" />
            <span className="sm:hidden">Print</span>
            <span className="hidden sm:inline">Print payslip</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
            disabled={!payslip}
            onClick={() => window.print()}
          >
            <DownloadIcon className="size-3.5 sm:size-4" />
            <span className="sm:hidden">PDF</span>
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      {isPending ? (
        <div
          className="space-y-3 rounded-xl border border-border/50 bg-card p-6"
          role="status"
        >
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive" role="alert">
          {isNotFound
            ? "Payslip not found."
            : isForbidden
              ? "You do not have access to this payslip."
              : errorMessage}
        </p>
      ) : null}

      {!isPending && !isError && payslip ? (
        <PayslipView payslip={payslip} />
      ) : null}
    </div>
  );
};
