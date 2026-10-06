"use client";

import { useEffect, useState } from "react";

// Shows the viewer's own clock for a session when they aren't on New York
// time. Rendered after mount only — the server can't know the visitor's
// zone, and printing a server-guessed time would be confidently wrong for
// exactly the guest-instructor audiences these pages are shared with.
export default function LocalSessionTime({ startsISO, endsISO }: { startsISO: string; endsISO: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone || zone === "America/New_York") return;
    const start = new Date(startsISO);
    const end = new Date(endsISO);
    const day = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const tz =
      new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(start).find((p) => p.type === "timeZoneName")
        ?.value ?? zone;
    setLabel(`${day}, ${t(start)}–${t(end)} ${tz} your time`);
  }, [startsISO, endsISO]);

  if (!label) return null;
  return <span className="block text-sm text-mist">{label}</span>;
}
