import { useCallback, useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "payroll.sidebar.collapsed";

export const useSidebarCollapsed = () => {
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
