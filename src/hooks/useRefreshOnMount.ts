"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

// Hook that refreshes the router cache when the page is navigated to.
// This fixes the "data not visible until manual refresh" issue — when
// you click a sidebar nav item, the destination page fetches fresh data
// instead of showing a stale cached version.
//
// The refresh is debounced (100ms) to avoid double-fetching on initial load.
export function useRefreshOnMount() {
  const router = useRouter();
  const pathname = usePathname();
  const lastPath = useRef<string>("");

  useEffect(() => {
    // Only refresh if this is a navigation (pathname changed), not the
    // initial page load.
    if (lastPath.current && lastPath.current !== pathname) {
      const t = setTimeout(() => router.refresh(), 100);
      return () => clearTimeout(t);
    }
    lastPath.current = pathname;
  }, [pathname, router]);

  // Update ref on unmount so next navigation triggers refresh
  useEffect(() => {
    return () => { lastPath.current = pathname; };
  }, [pathname]);
}
