import type { CutoffHalf, PayRunStatus } from "~/api-services/pay-runs.types";

/** Formats an ISO date (`YYYY-MM-DD`) for display, e.g. `Jul 1, 2026`. */
export const formatPayRunDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/** e.g. `Jul 1, 2026 – Aug 25, 2026` */
export const formatPayRunPeriod = (
  periodStart: string,
  periodEnd: string,
): string =>
  `${formatPayRunDate(periodStart)} – ${formatPayRunDate(periodEnd)}`;

/** Display money strings from HRIS (`"10250.00"` → `"10,250.00"`). */
export const formatPayslipMoney = (
  value: string | null | undefined,
): string => {
  if (value == null || value === "") return "—";
  const negative = value.trim().startsWith("-");
  const raw = negative ? value.trim().slice(1) : value.trim();
  const [whole = "0", fraction = ""] = raw.split(".");
  if (!/^\d+$/.test(whole) || (fraction.length > 0 && !/^\d+$/.test(fraction))) {
    return value;
  }
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const cents = (fraction + "00").slice(0, 2);
  return `${negative ? "-" : ""}${grouped}.${cents}`;
};

export const cutoffHalfLabel = (
  half: CutoffHalf | string,
  opts?: { withFunds?: boolean },
): string => {
  const withFunds = opts?.withFunds ?? false;
  if (half === "first") {
    return withFunds ? "1st half (HDMF + PhilHealth)" : "1st half";
  }
  if (half === "second") {
    return withFunds ? "2nd half (SSS)" : "2nd half";
  }
  return String(half);
};

export const payRunStatusLabel = (status: PayRunStatus | string): string => {
  if (status === "draft") return "Draft";
  if (status === "computing") return "Computing";
  if (status === "computed") return "Computed";
  if (status === "released") return "Released";
  return String(status);
};

/** Two cutoffs per month — monthly total from per-cutoff allowance (2 dp). */
export const monthlyAllowanceFromCutoff = (perCutoff: string): string => {
  const cleaned = perCutoff.replace(/,/g, "").trim();
  if (!cleaned || !/^\d+(\.\d{1,2})?$/.test(cleaned)) return "";
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return "";
  return (amount * 2).toFixed(2);
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const isoDate = (year: number, monthIndex: number, day: number): string =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

/** Last calendar day of `year` / `monthIndex` (0-based). */
const lastDayOfMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate();

/**
 * Semi-monthly PH cutoffs for a given half in `year` / `monthIndex` (0-based):
 * first = 1–15, second = 16–end.
 */
export const payPeriodForHalf = (
  year: number,
  monthIndex: number,
  half: CutoffHalf,
): { start: string; end: string } => {
  if (half === "first") {
    return {
      start: isoDate(year, monthIndex, 1),
      end: isoDate(year, monthIndex, 15),
    };
  }
  const last = lastDayOfMonth(year, monthIndex);
  return {
    start: isoDate(year, monthIndex, 16),
    end: isoDate(year, monthIndex, last),
  };
};

/** Current cutoff half + period for `date` (defaults to today). */
export const defaultPayPeriod = (
  date: Date = new Date(),
): { start: string; end: string; cutoffHalf: CutoffHalf } => {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const day = date.getDate();
  const cutoffHalf: CutoffHalf = day <= 15 ? "first" : "second";
  const { start, end } = payPeriodForHalf(year, monthIndex, cutoffHalf);
  return { start, end, cutoffHalf };
};

const parseIsoLocal = (iso: string): Date => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

/** Calendar days from `fromIso` to `toIso` (local dates). */
export const calendarDaysBetween = (fromIso: string, toIso: string): number => {
  const from = parseIsoLocal(fromIso);
  const to = parseIsoLocal(toIso);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
};

export const todayIsoLocal = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Label for computed batches approaching / past cutoff periodEnd.
 * Returns null when not computed or more than 7 days out.
 */
export const approvalDueLabel = (
  status: string,
  periodEnd: string,
  todayIso: string = todayIsoLocal(),
): string | null => {
  if (status !== "computed") return null;
  const days = calendarDaysBetween(todayIso, periodEnd);
  if (days <= 0) return "Approval overdue";
  if (days <= 2) return `Release due in ${days} day${days === 1 ? "" : "s"}`;
  if (days <= 7) return `Release due in ${days} days`;
  return null;
};

export const missingPayrollReasonLabel = (reason: string): string => {
  if (reason === "missing_hourly_rate") return "No hourly rate";
  if (reason === "missing_clock_link") return "No Tito Clock link";
  return reason;
};
