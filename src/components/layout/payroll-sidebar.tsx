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
        "fixed top-0 left-0 z-30 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 md:flex",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-3",
          isCollapsed && "justify-center px-2",
        )}
      >
        {!isCollapsed ? <TitoLogo size="sm" variant="sidebar" /> : null}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            !isCollapsed && "ml-auto",
            isCollapsed && "rotate-180",
          )}
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
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
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color] duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                isCollapsed && "justify-center px-2",
              )}
            >
              {active && !isCollapsed ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary"
                />
              ) : null}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/60",
                )}
              />
              {!isCollapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
