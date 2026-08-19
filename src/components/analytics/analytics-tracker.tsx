"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const ANON_KEY = "analytics_anon_id";

const getAnonId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  let value = window.localStorage.getItem(ANON_KEY);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY, value);
  }
  return value;
};

export const AnalyticsTracker = () => {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) {
      return;
    }
    lastPath.current = pathname;

    const payload = JSON.stringify({
      name: "page_view",
      path: pathname,
      referrer: document.referrer || undefined,
      anonId: getAnonId(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  }, [pathname]);

  return null;
};
