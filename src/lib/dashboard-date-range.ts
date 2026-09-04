import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subYears,
} from "date-fns";
import type { DateRange } from "react-day-picker";

export type DashboardDatePreset =
  | "week"
  | "twoWeeks"
  | "month"
  | "thisYear"
  | "pastYear"
  | "custom";

export type DashboardDateRange = {
  from: string;
  to: string;
  preset: DashboardDatePreset;
};

const toIso = (date: Date): string => format(date, "yyyy-MM-dd");

const weekOpts = { weekStartsOn: 1 as const };

export const DASHBOARD_DATE_PRESETS: {
  id: Exclude<DashboardDatePreset, "custom">;
  label: string;
}[] = [
  { id: "week", label: "This week" },
  { id: "twoWeeks", label: "Past two weeks" },
  { id: "month", label: "This month" },
  { id: "thisYear", label: "This year" },
  { id: "pastYear", label: "Past year" },
];

export const rangeForPreset = (
  preset: Exclude<DashboardDatePreset, "custom">,
  now = new Date(),
): DateRange => {
  switch (preset) {
    case "week":
      return {
        from: startOfWeek(now, weekOpts),
        to: endOfWeek(now, weekOpts),
      };
    case "twoWeeks":
      return { from: startOfDaySafe(subDays(now, 13)), to: endOfDaySafe(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "thisYear":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "pastYear": {
      const lastYear = subYears(now, 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    }
  }
};

const startOfDaySafe = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDaySafe = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

export const defaultDashboardDateRange = (
  now = new Date(),
): DashboardDateRange => {
  const range = rangeForPreset("month", now);
  return {
    from: toIso(range.from!),
    to: toIso(range.to!),
    preset: "month",
  };
};

export const toDashboardDateRange = (
  range: DateRange,
  preset: DashboardDatePreset = "custom",
): DashboardDateRange | null => {
  if (!range.from || !range.to) return null;
  return {
    from: toIso(range.from),
    to: toIso(range.to),
    preset,
  };
};

export const toPickerDateRange = (
  value: DashboardDateRange,
): DateRange => ({
  from: new Date(`${value.from}T00:00:00`),
  to: new Date(`${value.to}T00:00:00`),
});

/** Pay run overlaps the filter when its period intersects [from, to]. */
export const payRunOverlapsRange = (
  periodStart: string,
  periodEnd: string,
  from: string,
  to: string,
): boolean => periodStart <= to && periodEnd >= from;
