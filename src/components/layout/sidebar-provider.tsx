import type { ReactNode } from "react";
import {
  SidebarContext,
  useSidebarCollapsedState,
} from "~/hooks/use-sidebar-collapsed";

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const value = useSidebarCollapsedState();

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
