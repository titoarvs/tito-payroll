import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { formatPayRunPeriod } from "~/components/pay-runs/pay-run-display";
import { DateRangePicker } from "~/components/ui/date-range-picker";

export interface DateRangeValue {
  start: string;
  end: string;
}

interface PeriodDateRangeFieldProps {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const dateToIso = (date: Date): string => format(date, "yyyy-MM-dd");

const isoToDate = (value: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toPickerRange = (value: DateRangeValue): DateRange | undefined => {
  const from = isoToDate(value.start);
  const to = isoToDate(value.end);
  if (!from && !to) return undefined;
  return { from, to };
};

const fromPickerRange = (range: DateRange): DateRangeValue => ({
  start: range.from ? dateToIso(range.from) : "",
  end: range.to ? dateToIso(range.to) : "",
});

export const PeriodDateRangeField = ({
  value,
  onChange,
  disabled = false,
  className,
  id = "pay-run-period",
}: PeriodDateRangeFieldProps) => {
  const selected = useMemo(
    () => toPickerRange(value),
    [value.start, value.end],
  );

  return (
    <DateRangePicker
      id={id}
      disabled={disabled}
      className={className}
      value={selected}
      numberOfMonths={2}
      placeholder="Select pay period"
      formatLabel={(range) => {
        if (!range.from || !range.to) {
          if (!range.from) return "Select pay period";
          return `${format(range.from, "MMM d, yyyy")} – …`;
        }
        return formatPayRunPeriod(dateToIso(range.from), dateToIso(range.to));
      }}
      onChange={(range) => {
        if (!range?.from || !range.to) {
          onChange({ start: "", end: "" });
          return;
        }
        onChange(fromPickerRange(range));
      }}
    />
  );
};
