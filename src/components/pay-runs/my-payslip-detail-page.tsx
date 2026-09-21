import { Link } from "@tanstack/react-router";
import { PayslipDocument } from "~/components/pay-runs/payslip-document";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useMyPayslip } from "~/hooks/use-pay-runs";
import { HrisApiError } from "~/lib/hris-api-client";

interface MyPayslipDetailPageProps {
  payslipId: string;
}

export const MyPayslipDetailPage = ({
  payslipId,
}: MyPayslipDetailPageProps) => {
  const { data, isPending, isError, error } = useMyPayslip(payslipId);
  const payslip = data?.data;

  const handlePrint = () => {
    window.print();
  };

  if (isPending) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[32rem] w-full" />
      </div>
    );
  }

  if (isError || !payslip) {
    const status =
      error instanceof HrisApiError ? error.status : undefined;
    const message =
      status === 403
        ? "You can only view your own released payslips."
        : error instanceof HrisApiError
          ? error.message
          : "Payslip not found";

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to="/dashboard/my-payslips">← My payslips</Link>
        </Button>
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/dashboard/my-payslips">← My payslips</Link>
        </Button>
        <Button type="button" onClick={handlePrint}>
          Print / Save as PDF
        </Button>
      </div>
      <PayslipDocument payslip={payslip} />
    </div>
  );
};
