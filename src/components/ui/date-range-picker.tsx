import { format, startOfDay } from "date-fns";
import { ListFilterIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export type DateRangePickerSidebarContext = {
  draft: DateRange | undefined;
  setDraft: (range: DateRange | undefined) => void;
  applyRange: (range: DateRange) => void;
  close: () => void;
};

export type DateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  sidebar?:
    | React.ReactNode
    | ((ctx: DateRangePickerSidebarContext) => React.ReactNode);
  numberOfMonths?: number;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
  formatLabel?: (range: DateRange) => string;
};

const DISPLAY_FORMAT = "MMM d, yyyy";

const defaultFormatLabel = (range: DateRange): string => {
  if (!range.from) return "";
  if (!range.to) return format(range.from, DISPLAY_FORMAT);
  return `${format(range.from, DISPLAY_FORMAT)} – ${format(range.to, DISPLAY_FORMAT)}`;
};

const dayTime = (date: Date) => startOfDay(date).getTime();

const orderRange = (a: Date, b: Date): DateRange =>
  dayTime(a) <= dayTime(b) ? { from: a, to: b } : { from: b, to: a };

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
  id,
  className,
  sidebar,
  numberOfMonths = 2,
  align = "start",
  formatLabel = defaultFormatLabel,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(value);
  const [hoveredDay, setHoveredDay] = React.useState<Date | undefined>();
  const [month, setMonth] = React.useState<Date>(
    () => value?.from ?? value?.to ?? new Date(),
  );
  const skipSelectRef = React.useRef(false);

  const label = value?.from ? formatLabel(value) : placeholder;
  const months = Math.max(1, numberOfMonths);
  const selectingEnd = Boolean(draft?.from && !draft?.to);

  /** Live range while hovering the end date — mirrors the final selection look. */
  const displayedRange = React.useMemo(() => {
    if (selectingEnd && draft?.from && hoveredDay) {
      return orderRange(draft.from, hoveredDay);
    }
    return draft;
  }, [selectingEnd, draft, hoveredDay]);

  const syncOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(value);
      setMonth(value?.from ?? value?.to ?? new Date());
    }
    setHoveredDay(undefined);
    setOpen(nextOpen);
  };

  const commitAndClose = (range: DateRange) => {
    if (!range.from || !range.to) return;
    setDraft(range);
    setHoveredDay(undefined);
    onChange?.(range);
    setOpen(false);
  };

  const applyRange = (range: DateRange) => {
    if (range.from) setMonth(range.from);
    commitAndClose(range);
  };

  const handleDayClick = (day: Date, modifiers: Record<string, boolean>) => {
    if (modifiers.disabled) return;

    // Second click (on the day under the hover) → commit + close
    if (draft?.from && !draft.to) {
      skipSelectRef.current = true;
      commitAndClose(orderRange(draft.from, day));
      return;
    }

    // First click (or restart) → set start, keep open, enable hover preview
    skipSelectRef.current = true;
    setDraft({ from: day, to: undefined });
    setHoveredDay(undefined);
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (skipSelectRef.current) {
      skipSelectRef.current = false;
      return;
    }
    setDraft(range);
    setHoveredDay(undefined);
    if (range?.from && range.to) {
      onChange?.(range);
      setOpen(false);
    }
  };

  const sidebarNode =
    typeof sidebar === "function"
      ? sidebar({
          draft,
          setDraft: (range) => {
            setDraft(range);
            setHoveredDay(undefined);
            if (range?.from) setMonth(range.from);
          },
          applyRange,
          close: () => setOpen(false),
        })
      : sidebar;

  return (
    <Popover open={open} onOpenChange={syncOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label="Date range"
          data-empty={!value?.from}
          data-state={open ? "open" : "closed"}
          className={cn(
            "h-10 w-full justify-start gap-2 px-3 font-normal transition-[border-color,box-shadow,transform] duration-100 ease-out",
            "data-[empty=true]:text-muted-foreground",
            "data-[state=open]:border-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/30",
            className,
          )}
        >
          <ListFilterIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className={cn(
          "z-50 w-auto max-w-[calc(100vw-1.25rem)] overflow-hidden rounded-xl border border-border/50 bg-popover p-0 text-popover-foreground outline-none",
          "shadow-[0_12px_40px_-8px_color-mix(in_srgb,var(--tito-blue)_18%,transparent),0_4px_16px_color-mix(in_srgb,var(--tito-blue)_6%,transparent)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "origin-[var(--radix-popover-content-transform-origin)] duration-200",
        )}
      >
        <div className="flex">
          {sidebarNode ? (
            <aside className="flex w-[7.25rem] shrink-0 flex-col border-r border-border/40 p-1.5">
              {sidebarNode}
            </aside>
          ) : null}

          <div
            className="min-w-0 p-3"
            onMouseLeave={() => {
              if (selectingEnd) setHoveredDay(undefined);
            }}
          >
            <Calendar
              mode="range"
              month={month}
              onMonthChange={setMonth}
              selected={displayedRange}
              onSelect={handleSelect}
              onDayClick={handleDayClick}
              numberOfMonths={months}
              weekStartsOn={0}
              onDayMouseEnter={(date) => {
                if (selectingEnd) setHoveredDay(date);
              }}
              className="bg-transparent p-0 [--cell-size:2.25rem]"
              classNames={{
                root: "w-auto",
                months: cn(
                  "relative flex gap-6",
                  months > 1 ? "flex-row" : "flex-col",
                ),
                month:
                  "flex w-[calc(var(--cell-size)*7)] shrink-0 flex-col gap-2",
                month_caption:
                  "relative flex h-8 w-full items-center justify-center",
                caption_label: "text-sm font-medium tracking-tight",
                nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
                button_previous: "size-7 p-0",
                button_next: "size-7 p-0",
                month_grid: "w-full border-collapse",
                weekdays: "flex w-full",
                weekday:
                  "w-[--cell-size] flex-1 select-none text-center text-[11px] font-medium tracking-[0.04em] text-muted-foreground",
                week: "mt-1 flex w-full",
                day: cn(
                  "relative aspect-square h-auto w-[--cell-size] flex-1 overflow-hidden p-0 text-center text-sm",
                  "[&:first-child:has([data-range-middle=true])]:rounded-l-full",
                  "[&:last-child:has([data-range-middle=true])]:rounded-r-full",
                  "[&:last-child:has([data-range-start=true])]:rounded-r-full",
                  "[&:first-child:has([data-range-end=true])]:rounded-l-full",
                ),
                range_start:
                  "rounded-l-full bg-[color-mix(in_srgb,var(--tito-green)_22%,transparent)]",
                range_end:
                  "rounded-r-full bg-[color-mix(in_srgb,var(--tito-green)_22%,transparent)]",
                range_middle: cn(
                  "rounded-none",
                  selectingEnd
                    ? "bg-[color-mix(in_srgb,var(--tito-green)_14%,transparent)]"
                    : "bg-[color-mix(in_srgb,var(--tito-green)_22%,transparent)]",
                ),
                today: "rounded-full bg-muted text-foreground",
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
