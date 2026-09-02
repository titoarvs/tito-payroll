import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface DashboardKpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  isLoading?: boolean;
  to?: string;
  className?: string;
}

export const DashboardKpiCard = ({
  label,
  value,
  hint,
  icon: Icon,
  isLoading = false,
  to,
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-tito-green-text dark:bg-muted dark:text-primary"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </>
  );

  const cardClassName = cn(
    "tito-widget block border border-border/50 bg-card p-5 transition-[border-color,box-shadow,transform] duration-200",
    to &&
      "card-hover-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
