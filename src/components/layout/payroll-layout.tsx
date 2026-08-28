import type { ReactNode } from "react";
import { PayrollHeader } from "~/components/layout/payroll-header";
import { PayrollSidebar } from "~/components/layout/payroll-sidebar";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
import { cn } from "~/lib/utils";

interface PayrollLayoutProps {
  children: ReactNode;
}

export const PayrollLayout = ({ children }: PayrollLayoutProps) => {
  const { isCollapsed, isHydrated } = useSidebarCollapsed();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PayrollSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300",
          isCollapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <PayrollHeader />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};
