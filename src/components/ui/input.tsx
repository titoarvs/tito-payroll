import * as React from "react";

import { cn } from "~/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const NATIVE_PICKER_TYPES = new Set([
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
]);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const usesNativePicker = type != null && NATIVE_PICKER_TYPES.has(type);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-[border-color,box-shadow] duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          usesNativePicker &&
            "scheme-light dark:scheme-dark dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-70",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
