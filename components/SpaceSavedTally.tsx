"use client";

import { useEffect, useState } from "react";

// Fixed GB units, comma-grouped, 3 decimals -- specifically requested
// phrasing, not the auto-scaling B/KB/MB/GB/TB a generic byte formatter
// would produce. "123,456.789 GB" reads as a real, precise, growing number
// in a way "123 GB" or "0.1 TB" doesn't.
function formatGB(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

// Live "reclaimed since launch" counter for Unreal Custodian's repo page.
// Backed by app/api/unreal-custodian/space-saved -- anonymous, opt-in
// reports from the desktop app, aggregated server-side. Renders nothing if
// the total is still zero (nobody's opted in yet) rather than a hollow
// claim, and fails silently on a fetch error -- this is a nice-to-have
// stat, not something worth a visible error state on the page.
export default function SpaceSavedTally() {
  const [stats, setStats] = useState<{ totalBytes: number; totalReports: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/unreal-custodian/space-saved")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.totalBytes === "number" && typeof d.totalReports === "number") {
          setStats({ totalBytes: d.totalBytes, totalReports: d.totalReports });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats || stats.totalBytes <= 0) return null;

  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm">
      <span className="font-mono font-semibold text-teal">
        {formatGB(stats.totalBytes)} GB
      </span>
      <span className="text-mist">
        saved from {formatCount(stats.totalReports)} reported projects!
      </span>
    </div>
  );
}
