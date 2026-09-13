import { cn } from "~/lib/utils";
import { useTheme } from "~/components/theme-provider";

interface TitoLogoProps {
  className?: string;
  title?: string;
  size?: "xs" | "sm" | "default" | "lg";
  variant?: "default" | "sidebar";
  /** Icon mark only — used when the sidebar is collapsed. */
  markOnly?: boolean;
}

const sizeClasses = {
  xs: "text-sm tracking-tight",
  sm: "text-base",
  default: "text-lg",
  lg: "text-2xl sm:text-3xl tracking-[-0.02em]",
} as const;

const markClasses = {
  xs: "size-4",
  sm: "size-5",
  default: "size-6",
  lg: "size-8 sm:size-9",
} as const;

const gapClasses = {
  xs: "gap-1",
  sm: "gap-1.5",
  default: "gap-1.5",
  lg: "gap-2.5",
} as const;

export function TitoLogo({
  className,
  title = "Tito Payroll",
  size = "default",
  variant = "default",
  markOnly = false,
}: TitoLogoProps) {
  const isDark = useTheme().theme === "dark";
  const onSidebar = variant === "sidebar";
  // Light sidebar uses the color mark; dark theme / dark surfaces use white.
  const useLightMark = isDark;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold tracking-tight",
        gapClasses[size],
        !markOnly && sizeClasses[size],
        onSidebar ? "text-sidebar-foreground" : "text-foreground",
        className,
      )}
      aria-label={title}
    >
      <img
        src={useLightMark ? "/images/tito-white.png" : "/images/tito.png"}
        className={cn(markClasses[size], "shrink-0 object-contain")}
        alt=""
      />
      {!markOnly ? (
        <span
          className={cn(
            "font-mont font-semibold leading-none",
            onSidebar
              ? "text-sidebar-foreground"
              : "text-tito-blue dark:text-tito-green",
          )}
        >
          tito
          <span
            className={
              onSidebar
                ? "text-tito-green-text dark:text-sidebar-primary"
                : "text-tito-green dark:text-white"
            }
          >
            payroll
          </span>
          <b
            className={
              onSidebar
                ? "text-tito-green-text dark:text-sidebar-primary"
                : "text-tito-green dark:text-white"
            }
          >
            .
          </b>
        </span>
      ) : null}
    </span>
  );
}
