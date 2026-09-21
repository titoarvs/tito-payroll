import type { ReactNode } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
import { TitoLogo } from "~/components/branding/TitoLogo";
import {
  formatPayslipHours,
  formatPayslipMoney,
  formatPayslipPeriod,
  PAYSLIP_COMPANY,
} from "~/lib/payslip-letterhead";
import { cn } from "~/lib/utils";

interface PayslipDocumentProps {
  payslip: Payslip;
  className?: string;
}

const MoneyCell = ({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}) => (
  <td className={cn("px-2 py-0.5 text-right tabular-nums", className)}>
    {formatPayslipMoney(value)}
  </td>
);

const HoursCell = ({ value }: { value: string | null | undefined }) => (
  <td className="px-2 py-0.5 text-right tabular-nums">
    {formatPayslipHours(value)}
  </td>
);

const LabelCell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <td className={cn("px-2 py-0.5 text-left", className)}>{children}</td>
);

const TotalRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <tr className="bg-neutral-200 font-semibold text-neutral-900">
    <LabelCell className="font-semibold">{label}</LabelCell>
    <MoneyCell value={value} className="font-semibold" />
    <td />
    <td />
  </tr>
);

export const PayslipDocument = ({ payslip, className }: PayslipDocumentProps) => {
  const periodLabel = formatPayslipPeriod(payslip.periodEnd);
  const monthlyRate = payslip.monthlyRate ?? "0";
  const contribution = (
    Number(payslip.sss || 0) +
    Number(payslip.hdmf || 0) +
    Number(payslip.philhealth || 0)
  ).toFixed(2);

  return (
    <article
      className={cn(
        "payslip-document mx-auto w-full max-w-[52rem] border border-neutral-800 bg-white p-6 text-neutral-900 shadow-sm print:max-w-none print:border-black print:shadow-none",
        className,
      )}
      aria-label={`Payslip for ${payslip.employeeName ?? "employee"}`}
    >
      <header className="grid grid-cols-1 items-start gap-4 border-b border-neutral-800 pb-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="text-left text-xs leading-snug">
          <p className="text-sm font-bold uppercase tracking-wide">
            {PAYSLIP_COMPANY.name}
          </p>
          <p className="mt-1 max-w-[16rem]">{PAYSLIP_COMPANY.address}</p>
          <p className="mt-1">{PAYSLIP_COMPANY.vatLine}</p>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase underline decoration-2 underline-offset-4">
            Payslip
          </h1>
        </div>
        <div className="flex flex-col items-start gap-2 text-left text-xs sm:items-end sm:text-right">
          <TitoLogo size="sm" title="Tito Solutions" />
          <p>
            <span className="font-semibold">Payroll Period:</span> {periodLabel}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 border-b border-neutral-800 py-4 text-sm sm:grid-cols-2">
        <dl className="space-y-1">
          <div className="flex gap-2">
            <dt className="w-36 shrink-0 font-medium">Employee Name:</dt>
            <dd className="font-semibold uppercase">
              {payslip.employeeName || "—"}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-36 shrink-0 font-medium">Employee ID No.:</dt>
            <dd>{payslip.employeeCode || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-36 shrink-0 font-medium">Position:</dt>
            <dd>{payslip.position || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-36 shrink-0 font-medium">Status:</dt>
            <dd className="capitalize">{payslip.employmentStatus || "—"}</dd>
          </div>
        </dl>
        <dl className="space-y-1 sm:justify-self-end">
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-medium">SSS No:</dt>
            <dd>{payslip.sssNumber || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-medium">HDMF No:</dt>
            <dd>{payslip.hdmfNumber || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-medium">Philhealth No:</dt>
            <dd>{payslip.philhealthNumber || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 font-medium">TIN:</dt>
            <dd>{payslip.tinNumber || "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="overflow-x-auto pt-2">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-400 text-xs uppercase tracking-wide">
              <th className="px-2 py-2 text-left font-semibold" />
              <th className="px-2 py-2 text-right font-semibold">Monthly</th>
              <th className="px-2 py-2 text-right font-semibold">Per Cutoff</th>
              <th className="px-2 py-2 text-right font-semibold">Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <LabelCell className="pt-3 font-semibold">Salary and Wages</LabelCell>
              <td />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>Basic</LabelCell>
              <MoneyCell value={monthlyRate} />
              <MoneyCell value={payslip.basicPay} />
              <HoursCell value={payslip.hoursWorked} />
            </tr>
            <tr>
              <LabelCell>Allowance</LabelCell>
              <MoneyCell value={payslip.allowance} />
              <MoneyCell value={payslip.allowance} />
              <td />
            </tr>
            <TotalRow label="Total Gross Pay" value={payslip.grossPay} />

            <tr>
              <LabelCell className="pt-3 font-semibold">Deductions</LabelCell>
              <td />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>SSS</LabelCell>
              <MoneyCell value={payslip.sss} />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>HDMF</LabelCell>
              <MoneyCell value={payslip.hdmf} />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>Philhealth</LabelCell>
              <MoneyCell value={payslip.philhealth} />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>Contribution</LabelCell>
              <MoneyCell value={contribution} />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>Tax Withheld</LabelCell>
              <MoneyCell value={payslip.withholdingTax} />
              <td />
              <td />
            </tr>
            <TotalRow label="Total Deductions" value={payslip.totalDeductions} />

            <tr>
              <LabelCell className="pt-3 font-semibold">Adjustments</LabelCell>
              <td />
              <td />
              <td className="px-2 py-0.5 text-right text-xs font-medium">
                No of Hrs.
              </td>
            </tr>
            <tr>
              <LabelCell>Holiday pay</LabelCell>
              <MoneyCell value={payslip.holidayPay} />
              <td />
              <HoursCell value={payslip.holidayHours} />
            </tr>
            <tr>
              <LabelCell>Overtime</LabelCell>
              <MoneyCell value={payslip.overtimePay} />
              <td />
              <HoursCell value={payslip.overtimeHours} />
            </tr>
            <tr>
              <LabelCell>Night difference</LabelCell>
              <MoneyCell value={payslip.nightDiffPay} />
              <td />
              <HoursCell value={payslip.nightDiffHours} />
            </tr>
            <tr>
              <LabelCell>Leave (in Basic)</LabelCell>
              <MoneyCell value={payslip.leavePay} />
              <td />
              <td className="px-2 py-0.5 text-right tabular-nums text-xs">
                {payslip.paidLeaveDays ?? "0.00"}d
                {payslip.unpaidLeaveDays &&
                payslip.unpaidLeaveDays !== "0.00" &&
                payslip.unpaidLeaveDays !== "0"
                  ? ` / ${payslip.unpaidLeaveDays}d LWOP`
                  : ""}
              </td>
            </tr>
            <tr>
              <LabelCell>Adjustments</LabelCell>
              <MoneyCell value={payslip.otherAdjustment} />
              <td />
              <td />
            </tr>
            <tr>
              <LabelCell>13th month pay</LabelCell>
              <MoneyCell value={payslip.thirteenthMonthPay} />
              <td />
              <td />
            </tr>
            <TotalRow
              label="Total Adjustments"
              value={payslip.totalAdjustments}
            />
          </tbody>
        </table>
      </div>

      <footer className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-base font-bold text-red-600">
            NET PAY:{" "}
            <span className="underline decoration-2 underline-offset-4">
              {formatPayslipMoney(payslip.netPay)}
            </span>
          </p>
        </div>
        <div className="text-sm">
          <p className="text-neutral-600">Prepared by:</p>
          <p className="mt-1 font-semibold uppercase tracking-wide">
            {payslip.preparedByName || "—"}
          </p>
        </div>
      </footer>
    </article>
  );
};
