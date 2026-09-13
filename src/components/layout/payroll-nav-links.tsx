import { Link } from "@tanstack/react-router";
import {
  PAYROLL_NAV_SECTIONS,
  isNavActive,
  type PayrollNavItem,
} from "~/config/payroll-navigation";
import { cn } from "~/lib/utils";

interface PayrollNavLinksProps {
  items: PayrollNavItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export const PayrollNavLinks = ({
  items,
  pathname,
  collapsed = false,
  onNavigate,
  className,
}: PayrollNavLinksProps) => {
  const sections = PAYROLL_NAV_SECTIONS.map((section) => ({
    ...section,
    items: items.filter((item) => item.section === section.id),
  })).filter((section) => section.items.length > 0);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {sections.map((section) => (
        <div key={section.id} className="flex flex-col gap-1">
          {!collapsed ? (
            <p className="px-3 pb-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {section.label}
            </p>
          ) : (
            <span className="sr-only">{section.label}</span>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center overflow-hidden rounded-md py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98]",
                  active
                    ? "bg-tito-green text-tito-dark-green shadow-sm"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  collapsed ? "justify-center gap-0 px-2" : "gap-3 px-3",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active
                      ? "text-tito-dark-green"
                      : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "truncate whitespace-nowrap transition-[opacity,width] duration-200 ease-out",
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
                  )}
                  aria-hidden={collapsed}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};
