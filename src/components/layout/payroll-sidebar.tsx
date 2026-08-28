import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { TitoLogo } from "~/components/branding/TitoLogo";
import { Button } from "~/components/ui/button";
import {
  PAYROLL_NAV_ITEMS,
  type PayrollNavItem,
} from "~/config/payroll-navigation";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
import { useCurrentUser } from "~/hooks/use-current-user";
import type { HrisUser } from "~/lib/hris-auth";
import { cn } from "~/lib/utils";

const userRoles = (user: HrisUser | undefined): string[] => {
  if (!user) return [];
  const roles = new Set<string>();
  if (user.role) roles.add(user.role);
  for (const role of user.roles ?? []) roles.add(role);
  return [...roles];
};

const hasPayrollOps = (user: HrisUser | undefined): boolean =>
  userRoles(user).some((role) =>
    ["super_admin", "admin", "finance"].includes(role),
  );

const isNavActive = (pathname: string, item: PayrollNavItem): boolean =>
  item.exact
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);

interface PayrollSidebarProps {
  className?: string;
}

export const PayrollSidebar = ({ className }: PayrollSidebarProps) => {
  const { data: user } = useCurrentUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isCollapsed, toggleCollapsed } = useSidebarCollapsed();
  const isOps = hasPayrollOps(user);

  const navItems = PAYROLL_NAV_ITEMS.filter(
    (item) => !item.requiresPayrollOps || isOps,
  );

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-30 hidden h-screen flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 overflow-hidden border-b border-sidebar-border px-3 transition-[padding] duration-300 ease-in-out",
          isCollapsed ? "justify-center px-2" : "justify-between",
        )}
      >
        <div
          className={cn(
            "min-w-0 overflow-hidden transition-[opacity,width,margin] duration-300 ease-in-out",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          )}
          aria-hidden={isCollapsed}
        >
          <TitoLogo size="sm" variant="sidebar" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 text-sidebar-foreground/70 transition-transform duration-300 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isCollapsed ? "rotate-180" : "rotate-0",
          )}
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto p-2"
        aria-label="Main"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center overflow-hidden rounded-lg py-2 text-sm font-medium transition-[background-color,color,padding,gap] duration-300 ease-in-out",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                isCollapsed ? "justify-center gap-0 px-2" : "gap-3 px-3",
              )}
            >
              {active && !isCollapsed ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary transition-opacity duration-300 ease-in-out"
                />
              ) : null}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/60",
                )}
              />
              <span
                className={cn(
                  "truncate whitespace-nowrap transition-[opacity,width,margin] duration-300 ease-in-out",
                  isCollapsed
                    ? "ml-0 w-0 opacity-0"
                    : "ml-0 w-auto opacity-100",
                )}
                aria-hidden={isCollapsed}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
