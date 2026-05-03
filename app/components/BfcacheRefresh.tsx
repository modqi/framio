"use client";
import { useEffect } from "react";

// When the browser restores a page from bfcache (back/forward navigation),
// React's useEffect hooks don't re-run, leaving the page in a frozen state
// with stale data. Reloading on persisted pageshow events fixes this.
export default function BfcacheRefresh() {
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  return null;
}
