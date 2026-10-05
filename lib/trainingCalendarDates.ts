// ── "TBD via voting" placeholder dates for the /training calendar ──────────
//
// Pure date math, kept out of components/TrainingCalendar.tsx so the node
// test runner can import it without the "@/" alias or React.

// Same weekday slot as `afterISO` (a Wednesday 11a ET session), stepped
// forward from the last dated class — but never into the past. Once the
// last class is behind us the sequence continues from the first slot still
// ahead of `now`, so a placeholder card can't carry a date that has already
// gone by (the Sep 30 run ended and Oct 7 / Oct 14 cards would otherwise
// have sat on the page, stale, until the next schedule shipped).
// Stops at the end of the last class's calendar year — the fixed schedule
// owns its own run of weeks; this only continues the sequence.
export function upcomingTbdWednesdays(afterISO: string, count: number, now: number = Date.now()): string[] {
  const last = new Date(afterISO);
  const year = last.getUTCFullYear();
  const out: string[] = [];
  const cursor = new Date(last);
  do {
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  } while (cursor.getTime() <= now);
  while (out.length < count) {
    if (cursor.getUTCFullYear() !== year) break;
    out.push(cursor.toISOString());
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return out;
}
