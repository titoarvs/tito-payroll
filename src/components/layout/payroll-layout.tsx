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
          "flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out md:transition-[margin-left]",
          isCollapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <PayrollHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden p-4 md:p-8">
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
