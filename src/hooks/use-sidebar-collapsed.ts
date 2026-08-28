import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const SIDEBAR_STORAGE_KEY = "payroll.sidebar.collapsed";

export interface SidebarContextValue {
  isCollapsed: boolean;
  isHydrated: boolean;
  toggleCollapsed: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export const useSidebarCollapsed = (): SidebarContextValue => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarCollapsed must be used within SidebarProvider");
  }
  return context;
};

export const useSidebarCollapsedState = (): SidebarContextValue => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "true") {
        setIsCollapsed(true);
      }
    } catch {
      // localStorage may be unavailable
    }
    setIsHydrated(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // localStorage may be unavailable
      }
      return next;
    });
  }, []);

  return { isCollapsed, isHydrated, toggleCollapsed };
};
