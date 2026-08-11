import { NextRequest, NextResponse } from "next/server";
import { incrementToolStat, getToolStat } from "@/lib/db";
import { clientIp, rateLimitAllows, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";

const TOOL = "unreal-custodian";
const BYTES_METRIC = "bytes_reclaimed";
const REPORTS_METRIC = "reports_count";

// One legitimate `clean --apply` run could plausibly reclaim a genuinely
// huge amount (the README's own example machine had 2 TB reclaimable) --
// this cap exists only to stop a single crafted request from permanently
// corrupting the public tally, not to second-guess a real big number.
const MAX_BYTES_PER_REPORT = 50 * 1024 ** 4; // 50 TB
// A single machine's real report (539 projects on the README's own
// Windows example) can legitimately be in the hundreds -- this cap is
// only there to stop a crafted request from claiming an absurd count.
const MAX_PROJECT_COUNT_PER_REPORT = 100_000;

// Anonymous by design: no identifying info is accepted or stored, just a
// byte count (and how many projects it came from) added to one running
// total. Rate-limited per IP so the tally can't be trivially inflated by a
// script, not because real usage would ever hit this.
export async function POST(req: NextRequest) {
  try {
    if (!(await rateLimitAllows(`unreal-custodian-space-saved:${clientIp(req)}`, 20, 3600))) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }
    const body = await req.json().catch(() => null);
    const bytes = body?.bytes;
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) {
      return NextResponse.json({ error: "bytes must be a positive number." }, { status: 400 });
    }
    // Optional, defaults to 1 -- older clients (pre-project-count) still
    // send a bare {bytes}, and that's still exactly one report about one
    // clean run, same as it always was.
    const projectCountRaw = body?.projectCount;
    const projectCount =
      projectCountRaw === undefined
        ? 1
        : typeof projectCountRaw === "number" && Number.isFinite(projectCountRaw) && projectCountRaw > 0
          ? Math.floor(projectCountRaw)
          : null;
    if (projectCount === null) {
      return NextResponse.json(
        { error: "projectCount must be a positive number when provided." },
        { status: 400 }
      );
    }
    const clampedBytes = Math.min(Math.floor(bytes), MAX_BYTES_PER_REPORT);
    const clampedCount = Math.min(projectCount, MAX_PROJECT_COUNT_PER_REPORT);
    // Two independent rows, not one transaction -- a rare split where one
    // increments and the other doesn't is an acceptable edge case for a fun
    // public counter, not something worth the complexity of a real
    // multi-statement transaction over.
    const [totalBytes, totalReports] = await Promise.all([
      incrementToolStat(TOOL, BYTES_METRIC, clampedBytes),
      incrementToolStat(TOOL, REPORTS_METRIC, clampedCount),
    ]);
    return NextResponse.json({ ok: true, totalBytes, totalReports });
  } catch (err) {
    console.error("unreal-custodian space-saved POST error:", err);
    return NextResponse.json({ error: "Couldn't record that. Try again later." }, { status: 500 });
  }
}

// Aggregate, anonymous, already-public-in-spirit data — same open-CORS
// reasoning as /api/vote's GET: this lets the desktop app (not a browser,
// CORS-exempt anyway) and any future off-site display both read the total.
const READ_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: READ_CORS });
}

export async function GET() {
  try {
    const [totalBytes, totalReports] = await Promise.all([
      getToolStat(TOOL, BYTES_METRIC),
      getToolStat(TOOL, REPORTS_METRIC),
    ]);
    return NextResponse.json(
      { ok: true, totalBytes, totalReports },
      // Polled by a live widget (and fetched on every app launch) -- must
      // not freeze on a stale cached number.
      { headers: { ...READ_CORS, "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("unreal-custodian space-saved GET error:", err);
    return NextResponse.json({ error: "Couldn't load the total." }, { status: 500, headers: READ_CORS });
  }
}
