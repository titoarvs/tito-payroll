import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

interface AlertProps {
  children: ReactNode;
  variant?: "error" | "success" | "info";
  className?: string;
}

export const Alert = ({
  children,
  variant = "info",
  className,
}: AlertProps) => {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variant === "error" &&
          "border-destructive/40 bg-destructive/10 text-destructive",
        variant === "success" &&
          "border-primary/30 bg-primary/10 text-tito-green-text dark:text-primary",
        variant === "info" && "border-border bg-muted text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
};
