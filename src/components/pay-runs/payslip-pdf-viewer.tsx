import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
import {
  PayslipPdfDocument,
  payslipPdfFileName,
} from "~/components/pay-runs/payslip-pdf-document";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const PayslipPdfDownload = ({
  payslip,
  className,
}: {
  payslip: Payslip;
  className?: string;
}) => (
  <PDFDownloadLink
    document={<PayslipPdfDocument payslip={payslip} />}
    fileName={payslipPdfFileName(payslip)}
    className={cn(
      buttonVariants({ variant: "outline", size: "sm" }),
      "h-8 print:hidden",
      className,
    )}
  >
    {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
  </PDFDownloadLink>
);

export const PayslipPdfViewer = ({ payslip }: { payslip: Payslip }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className="overflow-hidden rounded-md border border-border/60 bg-neutral-200"
      aria-label={`Payslip for ${payslip.employeeName || "employee"}`}
    >
      {ready ? (
        <PDFViewer
          showToolbar
          className="block h-[min(82dvh,920px)] w-full border-0 bg-neutral-200"
        >
          <PayslipPdfDocument payslip={payslip} />
        </PDFViewer>
      ) : (
        <div
          className="h-[min(82dvh,920px)] w-full animate-pulse bg-neutral-200"
          role="status"
          aria-label="Loading payslip PDF"
        />
      )}
    </div>
  );
};
