"use client";

import { useEffect, useState } from "react";
import { announcements, type Announcement } from "@/lib/announcements";

// Runs client-side so a banner expires on its end date even if the site
// hasn't redeployed since. Height is published as --banner-h so the fixed
// Nav slides down to make room.
export default function AnnouncementBanner() {
  const [active, setActive] = useState<Announcement | null>(null);

  useEffect(() => {
    const now = Date.now();
    const current =
      announcements.find((a) => {
        if (sessionStorage.getItem(`banner-dismissed-${a.id}`)) return false;
        // Interpret dates in Eastern time, where the announcements live.
        const start = Date.parse(`${a.start}T00:00:00-04:00`);
        const end = Date.parse(`${a.end}T23:59:59-04:00`);
        return now >= start && now <= end;
      }) ?? null;
    setActive(current);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--banner-h", active ? "40px" : "0px");
    return () => {
      document.documentElement.style.setProperty("--banner-h", "0px");
    };
  }, [active]);

  if (!active) return null;
  const external = active.href.startsWith("http");

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-3 bg-teal px-4 text-[#0a0a12]">
      <a
        href={active.href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="truncate font-mono text-xs font-semibold tracking-tight hover:underline sm:text-sm"
      >
        {active.text} <span className="underline underline-offset-2">{active.cta} →</span>
      </a>
      <button
        aria-label="Dismiss announcement"
        className="shrink-0 rounded px-1 font-mono text-sm opacity-70 hover:opacity-100"
        onClick={() => {
          sessionStorage.setItem(`banner-dismissed-${active.id}`, "1");
          setActive(null);
        }}
      >
        ✕
      </button>
    </div>
  );
}
