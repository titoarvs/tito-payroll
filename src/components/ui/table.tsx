import * as React from "react";

import { cn } from "~/lib/utils";

/** Horizontal rules only. No cell grid. */
export const TABLE_BORDERED_CLASS =
  "border-separate border-spacing-0 [&_th]:border-x-0 [&_td]:border-x-0 [&_th]:border-t-0 [&_td]:border-t-0 [&_th]:border-b [&_td]:border-b [&_th]:border-border/50 [&_td]:border-border/40";

/** Scrollport for every payroll table. Grows with the rows and stops at 600px. */
export const TABLE_SCROLL_CLASS = "max-h-[600px] overflow-auto";

type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  /** Drop the fixed scroll height when the body has no data rows. */
  empty?: boolean;
};

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, empty = false, ...props }, ref) => (
    <div className={empty ? "overflow-x-auto" : TABLE_SCROLL_CLASS}>
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          TABLE_BORDERED_CLASS,
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "sticky top-0 z-10 bg-card [&_tr]:hover:bg-transparent [&_th]:bg-card",
      className,
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child_td]:border-b-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors duration-100 ease-out hover:bg-muted/40 motion-reduce:transition-none",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 text-left align-middle text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3.5 align-middle text-sm text-foreground",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
