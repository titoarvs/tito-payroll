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
