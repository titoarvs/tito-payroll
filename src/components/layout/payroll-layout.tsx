import type { ReactNode } from "react";
import { PayrollHeader } from "~/components/layout/payroll-header";
import { PayrollSidebar } from "~/components/layout/payroll-sidebar";
import { SidebarProvider } from "~/components/layout/sidebar-provider";
import { useSidebarCollapsed } from "~/hooks/use-sidebar-collapsed";
import { cn } from "~/lib/utils";

interface PayrollLayoutProps {
  children: ReactNode;
}

const PayrollLayoutFrame = ({ children }: PayrollLayoutProps) => {
  const { isCollapsed, isHydrated } = useSidebarCollapsed();

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <PayrollSidebar />
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden bg-white transition-[margin] duration-300 ease-in-out md:transition-[margin-left] dark:bg-card",
          isCollapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <PayrollHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-white px-4 py-5 md:px-8 md:py-8 dark:bg-card">
          <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
};

export const PayrollLayout = ({ children }: PayrollLayoutProps) => (
  <SidebarProvider>
    <PayrollLayoutFrame>{children}</PayrollLayoutFrame>
  </SidebarProvider>
);
