import type { ReactNode } from "react";
import type { Payslip } from "~/api-services/pay-runs.types";
import { TitoLogo } from "~/components/branding/TitoLogo";
import {
  cutoffHalfLabel,
  formatPayRunDate,
  formatPayRunPeriod,
  formatPayslipMoney,
} from "~/components/pay-runs/pay-run-display";
import { cn } from "~/lib/utils";

const COMPANY = {
  legalName: "Tito Solutions Philippines Inc.",
  address: "Unit 5A Hollywood Square, West Avenue, Quezon City",
  vat: "VAT Reg. 010-611-990-00000",
} as const;

type PayslipViewProps = {
  payslip: Payslip;
  className?: string;
};

const money = (value: string | null | undefined) => formatPayslipMoney(value);

const display = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
};

const InfoRow = ({
  label,
  children,
  last,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) => (
  <div
    className={cn(
      "grid grid-cols-1 gap-0.5 py-1.5 text-[13px] leading-5 sm:grid-cols-[7.25rem_1fr] sm:items-baseline sm:gap-x-3",
      !last && "border-b border-border/40",
    )}
  >
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 font-medium break-words text-foreground">{children}</dd>
  </div>
);

const AmountRow = ({
  label,
  value,
  strong,
  last,
}: {
  label: string;
  value: string | null | undefined;
  strong?: boolean;
  last?: boolean;
}) => (
  <div
    className={cn(
      "flex items-baseline justify-between gap-3 py-1.5 text-[13px] leading-5",
      !last && "border-b border-border/40",
      strong && "pt-2 font-semibold",
    )}
  >
    <span className={strong ? "text-foreground" : "text-muted-foreground"}>
      {label}
    </span>
    <span className="shrink-0 tabular-nums text-foreground">{money(value)}</span>
  </div>
);

const SectionTitle = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => (
  <h2
    id={id}
    className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase"
  >
    {children}
  </h2>
);

const MetaItem = ({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <p className={cn("min-w-0 text-[12px] leading-5 text-muted-foreground", className)}>
    <span className="text-muted-foreground">{label}: </span>
    <span className="font-medium text-foreground">{value}</span>
  </p>
);

export const PayslipView = ({ payslip, className }: PayslipViewProps) => {
  const periodLabel =
    payslip.periodStart && payslip.periodEnd
      ? formatPayRunPeriod(payslip.periodStart, payslip.periodEnd)
      : "—";
  const paymentDate = formatPayRunDate(payslip.periodEnd);
  const half = cutoffHalfLabel(payslip.cutoffHalf ?? "");

  return (
    <article
      id="payslip-document"
      className={cn(
        "rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm",
        className,
      )}
      aria-label="Payslip"
    >
      <header className="rounded-t-xl border-b border-border/50 bg-[color-mix(in_srgb,var(--tito-green)_12%,var(--card))] px-4 py-3 sm:px-5 sm:py-4 dark:bg-[color-mix(in_srgb,var(--tito-green)_14%,transparent)]">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-col gap-1 text-[12px] leading-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
              <MetaItem label="Payroll period" value={periodLabel} />
              <span
                aria-hidden
                className="hidden h-3 w-px shrink-0 bg-border/80 sm:block"
              />
              <MetaItem label="Payment date" value={paymentDate} />
              {payslip.cutoffHalf ? (
                <>
                  <span
                    aria-hidden
                    className="hidden h-3 w-px shrink-0 bg-border/80 sm:block"
                  />
                  <MetaItem label="Cutoff" value={half} />
                </>
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {COMPANY.legalName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {COMPANY.address}
                <span className="text-border"> · </span>
                {COMPANY.vat}
              </p>
            </div>
          </div>

          <TitoLogo
            size="lg"
            markOnly
            className="hidden shrink-0 self-center sm:inline-flex"
          />
        </div>
      </header>

      <div className="grid gap-5 px-4 py-4 sm:px-5 sm:py-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="payslip-employee-info">
            <SectionTitle id="payslip-employee-info">
              Employee information
            </SectionTitle>
            <dl>
              <InfoRow label="Employee name">
                {display(payslip.employeeName)}
              </InfoRow>
              <InfoRow label="Employee ID">
                <span className="tabular-nums">
                  {display(payslip.employeeCode)}
                </span>
              </InfoRow>
              <InfoRow label="Department">
                {display(payslip.department)}
              </InfoRow>
              <InfoRow label="Job title">{display(payslip.position)}</InfoRow>
              <InfoRow label="Status">
                {display(payslip.employmentStatus)}
              </InfoRow>
              <InfoRow label="Tax ID (TIN)">
                <span className="tabular-nums">{display(payslip.tinNumber)}</span>
              </InfoRow>
              <InfoRow label="Hours worked">
                <span className="tabular-nums">{payslip.hoursWorked}</span>
              </InfoRow>
              <InfoRow label="Hourly rate" last>
                <span className="tabular-nums">{money(payslip.hourlyRate)}</span>
              </InfoRow>
            </dl>
          </section>

          <section aria-labelledby="payslip-statutory-ids">
            <SectionTitle id="payslip-statutory-ids">
              Statutory IDs
            </SectionTitle>
            <dl>
              <InfoRow label="SSS No.">
                <span className="tabular-nums">{display(payslip.sssNumber)}</span>
              </InfoRow>
              <InfoRow label="HDMF No.">
                <span className="tabular-nums">
                  {display(payslip.pagibigNumber)}
                </span>
              </InfoRow>
              <InfoRow label="PhilHealth No." last>
                <span className="tabular-nums">
                  {display(payslip.philhealthNumber)}
                </span>
              </InfoRow>
            </dl>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section aria-labelledby="payslip-earnings">
            <SectionTitle id="payslip-earnings">Earnings</SectionTitle>
            <div>
              <AmountRow label="Basic pay" value={payslip.basicPay} />
              <AmountRow label="Allowance" value={payslip.allowance} />
              <AmountRow
                label="Total gross income"
                value={payslip.grossPay}
                strong
                last
              />
            </div>
          </section>

          <section aria-labelledby="payslip-deductions">
            <SectionTitle id="payslip-deductions">Deductions</SectionTitle>
            <div>
              <AmountRow label="SSS" value={payslip.sss} />
              <AmountRow label="HDMF" value={payslip.hdmf} />
              <AmountRow label="PhilHealth" value={payslip.philhealth} />
              <AmountRow
                label="Total deductions"
                value={payslip.totalDeductions}
                strong
                last
              />
            </div>
          </section>

          <section
            aria-labelledby="payslip-net-summary"
            className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3"
          >
            <SectionTitle id="payslip-net-summary">Net pay summary</SectionTitle>
            <div className="mt-1 flex items-end justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                Net pay
              </p>
              <p className="text-xl font-semibold tracking-tight text-tito-green-text tabular-nums sm:text-2xl dark:text-primary">
                {money(payslip.netPay)}
              </p>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-border/50 px-4 py-2.5 sm:px-5">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Generated electronically by Tito Payroll for this released cutoff.
        </p>
      </footer>
    </article>
  );
};
