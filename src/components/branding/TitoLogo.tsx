import { cn } from "~/lib/utils";
import { useTheme } from "~/components/theme-provider";

interface TitoLogoProps {
  className?: string;
  title?: string;
  size?: "sm" | "default";
  variant?: "default" | "sidebar";
}

const sizeClasses = {
  sm: "text-base",
  default: "text-lg",
} as const;

const markClasses = {
  sm: "size-5",
  default: "size-6",
} as const;

export function TitoLogo({
  className,
  title = "Tito Payroll",
  size = "default",
  variant = "default",
}: TitoLogoProps) {
  const isDark = useTheme().theme === "dark";
  const onSidebar = variant === "sidebar";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold tracking-tight",
        sizeClasses[size],
        onSidebar ? "text-sidebar-foreground" : "text-foreground",
        className,
      )}
      aria-label={title}
    >
      <img
        src={
          onSidebar || isDark ? "/images/tito-white.png" : "/images/tito.png"
        }
        className={cn(markClasses[size], "object-contain")}
        alt=""
      />
      <span
        className={cn(
          "font-mont font-semibold",
          onSidebar
            ? "text-sidebar-foreground"
            : "text-tito-blue dark:text-tito-green",
        )}
      >
        tito
        <span className={onSidebar ? "text-sidebar-primary" : "text-tito-green dark:text-white"}>
          payroll
        </span>
        <b className={onSidebar ? "text-sidebar-primary" : "text-tito-green dark:text-white"}>
          .
        </b>
      </span>
    </span>
  );
}
