import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

type KpiAccent = "green" | "blue" | "sky" | "slate";

const ACCENT_ICON: Record<KpiAccent, string> = {
  green:
    "border-tito-green/25 bg-tito-green/15 text-tito-dark-green dark:border-tito-green/30 dark:bg-tito-green/10 dark:text-tito-green",
  blue: "border-tito-blue/20 bg-tito-blue/10 text-tito-blue dark:border-white/15 dark:bg-white/10 dark:text-white",
  sky: "border-tito-dull-blue/20 bg-tito-dull-blue/10 text-tito-dull-blue dark:border-tito-dull-blue/35 dark:bg-tito-dull-blue/20 dark:text-[#9eb6e0]",
  slate:
    "border-border bg-muted/60 text-muted-foreground dark:border-border dark:bg-muted/40",
};

const ACCENT_HOVER: Record<KpiAccent, string> = {
  green: "hover:border-tito-green/35",
  blue: "hover:border-tito-blue/30",
  sky: "hover:border-tito-dull-blue/35",
  slate: "hover:border-border",
};

interface DashboardKpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  to?: string;
  accent?: KpiAccent;
  className?: string;
}

export const DashboardKpiCard = ({
  label,
  value,
  hint,
  icon: Icon,
  isLoading = false,
  to,
  accent = "green",
  className,
}: DashboardKpiCardProps) => {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </p>
          )}
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
            ACCENT_ICON[accent],
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </>
  );

  const cardClassName = cn(
    "tito-widget block border border-border/60 bg-card p-5 transition-[border-color,box-shadow,transform] duration-200",
    to &&
      cn(
        "card-hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ACCENT_HOVER[accent],
      ),
    className,
  );

  if (to) {
    return (
      <Link to={to} className={cardClassName} aria-label={`${label}: ${value}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClassName} aria-label={label}>
      {content}
    </div>
  );
};
