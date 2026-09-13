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

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="min-w-0 space-y-0.5">
    <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
      {label}
    </dt>
    <dd className="text-sm font-medium break-words text-foreground">{children}</dd>
  </div>
);

const MoneyLine = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: string | null | undefined;
  muted?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
    <span className={muted ? "text-muted-foreground" : "text-foreground"}>
      {label}
    </span>
    <span
      className={cn(
        "shrink-0 tabular-nums",
        muted ? "text-muted-foreground" : "font-medium text-foreground",
      )}
    >
      {money(value)}
    </span>
  </div>
);

const MoneyTotal = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-border/60 pt-2.5 text-sm font-semibold text-foreground">
    <span>{label}</span>
    <span className="shrink-0 tabular-nums">{money(value)}</span>
  </div>
);

export const PayslipView = ({ payslip, className }: PayslipViewProps) => {
  const periodLabel =
    payslip.periodStart && payslip.periodEnd
      ? formatPayRunPeriod(payslip.periodStart, payslip.periodEnd)
      : "—";
  const paymentDate = formatPayRunDate(payslip.periodEnd);
  const half = payslip.cutoffHalf
    ? cutoffHalfLabel(payslip.cutoffHalf)
    : null;
  const employeeName = display(payslip.employeeName);

  return (
    <article
      id="payslip-document"
      className={cn(
        "overflow-hidden rounded-2xl border border-border/50 bg-card text-card-foreground shadow-[0_1px_0_color-mix(in_srgb,white_55%,transparent)_inset,0_12px_32px_color-mix(in_srgb,var(--tito-blue)_6%,transparent)]",
        className,
      )}
      aria-label="Payslip"
    >
      {/* Brand band */}
      <header className="relative overflow-hidden border-b border-border/50 bg-[linear-gradient(160deg,#ffffff_0%,color-mix(in_srgb,var(--tito-green)_10%,#ffffff)_42%,color-mix(in_srgb,var(--tito-dull-blue)_6%,#ffffff)_100%)] px-5 py-5 sm:px-7 sm:py-6 dark:bg-[linear-gradient(160deg,var(--card)_0%,color-mix(in_srgb,var(--tito-green)_8%,var(--card))_50%,var(--card)_100%)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--tito-green),var(--tito-dull-blue))]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-20 -right-12 size-48 rounded-full bg-tito-green/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-8 size-40 rounded-full bg-tito-dull-blue/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border/60 bg-white/80 px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase dark:bg-card/80">
                Payslip
              </span>
              {half ? (
                <span className="rounded-md bg-tito-green px-2 py-1 text-[10px] font-semibold tracking-[0.06em] text-tito-dark-green uppercase">
                  {half}
                </span>
              ) : null}
            </div>
            <TitoLogo
              size="lg"
              markOnly
              className="hidden shrink-0 sm:inline-flex"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-8">
            <div className="min-w-0 space-y-1.5">
              <h2 className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
                {employeeName}
              </h2>
              <p className="text-sm tabular-nums text-muted-foreground">
                {display(payslip.employeeCode)}
              </p>
              {(payslip.department || payslip.position) && (
                <p className="text-sm text-muted-foreground">
                  {[payslip.department, payslip.position]
                    .map((value) => value?.trim())
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-border/50 bg-white/70 p-3.5 sm:grid-cols-3 dark:bg-card/50">
              <div className="min-w-0 sm:border-r sm:border-border/40 sm:pr-3">
                <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  Period
                </dt>
                <dd className="mt-1 text-sm font-medium leading-snug text-foreground">
                  {periodLabel}
                </dd>
              </div>
              <div className="min-w-0 sm:border-r sm:border-border/40 sm:px-3">
                <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  Payment date
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {paymentDate}
                </dd>
              </div>
              <div className="min-w-0 sm:pl-3">
                <dt className="text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  Hours worked
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums text-foreground">
                  {payslip.hoursWorked}
                  <span className="ml-1 font-normal text-muted-foreground">
                    hrs
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* Company strip */}
      <div className="flex flex-col gap-0.5 border-b border-border/40 bg-muted/25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-sm font-semibold text-foreground">
          {COMPANY.legalName}
        </p>
        <p className="text-xs text-muted-foreground">
          {COMPANY.address}
          <span className="mx-1.5 text-border">·</span>
          {COMPANY.vat}
        </p>
      </div>

      <div className="grid gap-6 px-5 py-5 sm:px-7 sm:py-6 lg:grid-cols-12 lg:gap-8">
        {/* Employee + IDs */}
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <section aria-labelledby="payslip-employee-info">
            <h3
              id="payslip-employee-info"
              className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
            >
              Employee details
            </h3>
            <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
              <Field label="Status">{display(payslip.employmentStatus)}</Field>
              <Field label="Tax ID (TIN)">
                <span className="tabular-nums">{display(payslip.tinNumber)}</span>
              </Field>
              <Field label="Hourly rate">
                <span className="tabular-nums">{money(payslip.hourlyRate)}</span>
              </Field>
              <Field label="Job title">{display(payslip.position)}</Field>
            </dl>
          </section>

          <section aria-labelledby="payslip-statutory-ids">
            <h3
              id="payslip-statutory-ids"
              className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
            >
              Statutory IDs
            </h3>
            <dl className="grid gap-3 rounded-xl border border-border/50 bg-muted/15 p-3.5 sm:grid-cols-1">
              <Field label="SSS No.">
                <span className="tabular-nums">{display(payslip.sssNumber)}</span>
              </Field>
              <Field label="Pag-IBIG (HDMF) No.">
                <span className="tabular-nums">
                  {display(payslip.pagibigNumber)}
                </span>
              </Field>
              <Field label="PhilHealth No.">
                <span className="tabular-nums">
                  {display(payslip.philhealthNumber)}
                </span>
              </Field>
            </dl>
          </section>
        </div>

        {/* Money columns */}
        <div className="min-w-0 space-y-4 lg:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <section
              aria-labelledby="payslip-earnings"
              className="rounded-xl border border-border/50 p-4"
            >
              <h3
                id="payslip-earnings"
                className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
              >
                Earnings
              </h3>
              <div className="divide-y divide-border/40">
                <MoneyLine label="Basic pay" value={payslip.basicPay} muted />
                <MoneyLine label="Allowance" value={payslip.allowance} muted />
              </div>
              <MoneyTotal label="Gross pay" value={payslip.grossPay} />
            </section>

            <section
              aria-labelledby="payslip-deductions"
              className="rounded-xl border border-border/50 p-4"
            >
              <h3
                id="payslip-deductions"
                className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
              >
                Deductions
              </h3>
              <div className="divide-y divide-border/40">
                <MoneyLine label="SSS" value={payslip.sss} muted />
                <MoneyLine label="Pag-IBIG" value={payslip.hdmf} muted />
                <MoneyLine label="PhilHealth" value={payslip.philhealth} muted />
              </div>
              <MoneyTotal
                label="Total deductions"
                value={payslip.totalDeductions}
              />
            </section>
          </div>

          <section
            aria-labelledby="payslip-net-summary"
            className="relative overflow-hidden rounded-xl border border-tito-green/25 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tito-green)_18%,#ffffff)_0%,color-mix(in_srgb,var(--tito-dull-green)_10%,#ffffff)_100%)] px-5 py-4 dark:border-tito-green/30 dark:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--tito-green)_16%,transparent),transparent)]"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3
                  id="payslip-net-summary"
                  className="text-[11px] font-semibold tracking-[0.08em] text-tito-dark-green/70 uppercase dark:text-tito-green/80"
                >
                  Net pay
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Take-home for this released cutoff
                </p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-tito-dark-green tabular-nums sm:text-4xl dark:text-tito-green">
                {money(payslip.netPay)}
              </p>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-border/40 px-5 py-3 sm:px-7">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Generated electronically by Tito Payroll for this released cutoff.
          Figures match the published payslip snapshot.
        </p>
      </footer>
    </article>
  );
};
