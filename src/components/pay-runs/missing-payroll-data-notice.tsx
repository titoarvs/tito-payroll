import { Link } from "@tanstack/react-router";
import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { MissingPayrollDataIssue } from "~/api-services/pay-runs.types";
import { missingPayrollReasonLabel } from "~/components/pay-runs/pay-run-display";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface MissingPayrollDataNoticeProps {
  issues: MissingPayrollDataIssue[];
}

const SEARCH_THRESHOLD = 8;

const compareByName = (
  left: MissingPayrollDataIssue,
  right: MissingPayrollDataIssue,
): number =>
  left.employeeName.localeCompare(right.employeeName, undefined, {
    sensitivity: "base",
  });

export const MissingPayrollDataNotice = ({
  issues,
}: MissingPayrollDataNoticeProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...issues].sort(compareByName),
    [issues],
  );

  const counts = useMemo(() => {
    let hourly = 0;
    let clock = 0;
    for (const issue of sorted) {
      if (issue.reasons.includes("missing_hourly_rate")) hourly += 1;
      if (issue.reasons.includes("missing_clock_link")) clock += 1;
    }
    return { hourly, clock };
  }, [sorted]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((issue) => {
      const code = issue.employeeCode?.toLowerCase() ?? "";
      return (
        issue.employeeName.toLowerCase().includes(needle) ||
        code.includes(needle)
      );
    });
  }, [query, sorted]);

  const employeeLabel =
    sorted.length === 1 ? "1 employee" : `${sorted.length} employees`;

  return (
    <section
      aria-labelledby="missing-payroll-data-heading"
      className="overflow-hidden rounded-md border border-amber-500/40 bg-amber-50 text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/40 dark:text-amber-50"
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="missing-payroll-data-heading"
              className="text-sm font-medium text-amber-950 dark:text-amber-50"
            >
              Missing payroll data
            </h3>
            <Badge className="border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-100">
              {employeeLabel}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80 sm:text-sm">
            Compute includes only employees with Clock time entries in this
            cutoff. Hourly pay stays at zero until a rate is set.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {counts.hourly > 0 ? (
              <Badge className="border-amber-600/25 bg-amber-500/10 text-amber-900 dark:border-amber-300/25 dark:text-amber-100">
                {counts.hourly} no hourly rate
              </Badge>
            ) : null}
            {counts.clock > 0 ? (
              <Badge className="border-amber-600/25 bg-amber-500/10 text-amber-900 dark:border-amber-300/25 dark:text-amber-100">
                {counts.clock} no Tito Clock link
              </Badge>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 self-start border-amber-600/30 bg-amber-50 text-amber-950 hover:bg-amber-100 sm:self-center dark:border-amber-300/30 dark:bg-transparent dark:text-amber-50 dark:hover:bg-amber-900/40"
          aria-expanded={open}
          aria-controls="missing-payroll-data-list"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Hide list" : "Review"}
          <ChevronDownIcon
            className={cn(
              "transition-transform duration-150 ease-out motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </Button>
      </div>

      {open ? (
        <div
          id="missing-payroll-data-list"
          className="border-t border-amber-500/25 bg-amber-50/80 dark:border-amber-400/20 dark:bg-amber-950/20"
        >
          {sorted.length > SEARCH_THRESHOLD ? (
            <div className="px-4 pt-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or employee code"
                aria-label="Search employees with missing payroll data"
                className="h-8"
              />
            </div>
          ) : null}
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No employees match that search.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto px-2 py-2">
              {visible.map((issue) => {
                const code = issue.employeeCode?.trim();
                return (
                  <li key={issue.employeeId}>
                    <Link
                      to="/dashboard/employees/$id"
                      params={{ id: issue.employeeId }}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {issue.employeeName}
                        </span>
                        {code ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            #{code}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 flex-wrap justify-end gap-1">
                        {issue.reasons.map((reason) => (
                          <Badge key={reason} variant="muted">
                            {missingPayrollReasonLabel(reason)}
                          </Badge>
                        ))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
};
