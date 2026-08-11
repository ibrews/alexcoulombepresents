"use client";

import { useEffect, useState } from "react";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

// Live "reclaimed since launch" counter for Unreal Custodian's repo page.
// Backed by app/api/unreal-custodian/space-saved -- anonymous, opt-in
// reports from the desktop app, aggregated server-side. Renders nothing if
// the total is still zero (nobody's opted in yet) rather than a hollow "0 B"
// claim, and fails silently on a fetch error -- this is a nice-to-have
// stat, not something worth a visible error state on the page.
export default function SpaceSavedTally() {
  const [totalBytes, setTotalBytes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/unreal-custodian/space-saved")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.totalBytes === "number") setTotalBytes(d.totalBytes);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!totalBytes) return null;

  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm">
      <span className="font-mono font-semibold text-teal">{formatBytes(totalBytes)}</span>
      <span className="text-mist">reclaimed by people using this, since launch</span>
    </div>
  );
}
