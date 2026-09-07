import { useRouterState } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { TitoLogo } from "~/components/branding/TitoLogo";
import { PayrollNavLinks } from "~/components/layout/payroll-nav-links";
import { Button } from "~/components/ui/button";
import { PAYROLL_NAV_ITEMS } from "~/config/payroll-navigation";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
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
  ).map((item) =>
    isOps && item.to === "/dashboard/my-payslips"
      ? { ...item, label: "Payslips" }
      : item,
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
          "flex h-12 shrink-0 items-center gap-1.5 overflow-hidden px-3 transition-[padding] duration-300 ease-in-out",
          isCollapsed ? "justify-center px-2" : "justify-between",
        )}
      >
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 hover:bg-muted"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            aria-expanded={false}
          >
            <TitoLogo size="sm" variant="sidebar" markOnly />
          </Button>
        ) : (
          <>
            <div className="min-w-0 overflow-hidden">
              <TitoLogo size="sm" variant="sidebar" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
              aria-expanded
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-2.5 pb-2"
        aria-label="Main"
      >
        <PayrollNavLinks
          items={navItems}
          pathname={pathname}
          collapsed={isCollapsed}
        />
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-sidebar-border px-3 py-4",
          isCollapsed && "px-2",
        )}
      >
        {!isCollapsed ? (
          <p className="px-1 text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Tito
          </p>
        ) : (
          <span className="sr-only">© Tito</span>
        )}
      </div>
    </aside>
  );
};
