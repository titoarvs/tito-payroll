import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) => (
  <div
    className={cn(
      "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
      className,
    )}
  >
    <div className="min-w-0 space-y-1">
      <h2 className="page-title text-2xl font-semibold text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? (
      <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
    ) : null}
  </div>
);
