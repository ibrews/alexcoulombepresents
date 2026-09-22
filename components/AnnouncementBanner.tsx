"use client";

import { useEffect, useRef, useState } from "react";
import { announcements, type Announcement } from "@/lib/announcements";

// Resolve in Eastern time on the client so dated news expires without a deploy.
export default function AnnouncementBanner() {
  const [active, setActive] = useState<Announcement | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refresh() {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
      }).formatToParts(new Date());
      const part = (type: string) => parts.find((p) => p.type === type)?.value;
      const today = `${part("year")}-${part("month")}-${part("day")}`;
      setActive(announcements.find((a) => {
        if (today < a.start || today > a.end) return false;
        try { return !sessionStorage.getItem(`banner-dismissed-${a.id}`); }
        catch { return true; }
      }) ?? null);
    }
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    const node = bannerRef.current;
    const measure = () => document.documentElement.style.setProperty("--banner-h", `${node?.getBoundingClientRect().height ?? 0}px`);
    measure();
    const observer = node ? new ResizeObserver(measure) : null;
    if (node) observer?.observe(node);
    return () => {
      observer?.disconnect();
      document.documentElement.style.setProperty("--banner-h", "0px");
    };
  }, [active]);

  if (!active) return null;
  const external = active.href.startsWith("http");

  return (
    <div ref={bannerRef} className="fixed inset-x-0 top-0 z-50 flex min-h-10 items-center justify-center gap-3 bg-teal px-4 py-2 text-[#0a0a12]">
      <a href={active.href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}
        className="text-balance text-center font-mono text-xs font-semibold leading-relaxed tracking-tight hover:underline sm:text-sm">
        {active.text} <span className="whitespace-nowrap underline underline-offset-2">{active.cta} →</span>
      </a>
      <button aria-label="Dismiss announcement" className="flex h-8 w-8 shrink-0 items-center justify-center rounded font-mono text-sm opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2"
        onClick={() => {
          try { sessionStorage.setItem(`banner-dismissed-${active.id}`, "1"); } catch { /* Storage may be disabled. */ }
          setActive(null);
        }}>✕</button>
    </div>
  );
}
