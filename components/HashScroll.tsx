"use client";

import { useEffect } from "react";

/**
 * Reliable anchor scrolling. Cross-page hash navigation (e.g. /training#learn-ai
 * from another page) and reveal-animated sections don't always scroll natively in
 * the App Router, so we scroll to the hash target on mount and on hashchange.
 */
export default function HashScroll() {
  useEffect(() => {
    function scrollToHash() {
      const id = window.location.hash.slice(1);
      if (!id) return;
      // Let layout + reveal animations settle, then scroll.
      const t = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(t);
    }
    const cleanup = scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      cleanup?.();
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}
