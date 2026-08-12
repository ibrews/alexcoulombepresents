"use client";

import { useEffect, useState } from "react";
import { formatSlotDay, formatSlotTime, zoneLabel } from "@/lib/booking/availability";

type Slot = { start: string; end: string };
type Duration = {
  hours: number;
  label: string;
  minutes: number;
  standardPriceCents: number;
  prices: Record<string, number>;
};
type Rate = { id: string; label: string; note: string | null };
type SlotsResponse = {
  timeZone: string;
  durations: Duration[];
  rates: Rate[];
  slotsByHours: Record<string, Slot[]>;
};

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;
// Matches lib/booking/config.ts's BOOKING_TIMEZONE. Not imported from there —
// that module reaches for the database and server-only env, which has no
// business in a client bundle for the sake of one string literal. The API
// response's own `timeZone` field carries the authoritative value; this is
// only the pre-fetch default so the page has something sane to render before
// that response (and the viewer-zone detection right after mount) land.
const BOOKING_TIMEZONE_ID = "America/New_York";
const BOOKING_ZONE_LABEL = "Eastern (New York)";

// Neither wait below has a knowable duration to show as a real percentage —
// the calendar fetch can retry a slow feed for up to ~20s, and the request
// step sends two emails before it answers. A bar with a fabricated
// percentage would just be lying faster or slower than reality; this instead
// shows honest, escalating status text next to an indeterminate bar, so
// "still working" is visible without pretending to know how long it'll be.
function useElapsedStage(active: boolean, stages: Array<{ afterMs: number; text: string }>): string {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!active) {
      setMs(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => setMs(Date.now() - start), 250);
    return () => clearInterval(id);
  }, [active]);
  let text = stages[0]?.text ?? "";
  for (const stage of stages) if (ms >= stage.afterMs) text = stage.text;
  return text;
}

function ProgressBar({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <div className="progress-indeterminate" />
      <p className="text-sm text-mist">{label}</p>
    </div>
  );
}

export default function BookingPicker() {
  // One fetch, once, on mount — every duration's slot list and every rate's
  // price all arrive together, so switching either selection afterward is a
  // client-side lookup with no network round-trip. It used to refetch on
  // every click, which meant every click re-ran the full calendar read
  // (including its retry budget on a slow feed) — a multi-second wait for a
  // selection that doesn't change what's on the calendar at all.
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [hours, setHours] = useState(1);
  const [rate, setRate] = useState("standard");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Defaults to New York (server-rendered, so this never mismatches what the
  // server sent — Date/Intl calls that depend on the visitor's own clock or
  // locale can't run during SSR) and is swapped to the visitor's own zone
  // right after mount, via the one browser API that can answer "what zone is
  // this person actually in" with no permission prompt and no guessing from
  // IP geolocation.
  const [viewerZone, setViewerZone] = useState(BOOKING_TIMEZONE_ID);
  // "auto" covers both the pre-detection default AND the post-mount
  // auto-detected zone — neither was a choice the visitor made. Only
  // clicking one of the two override controls below sets "manual", and that
  // distinction is what the status line reports; without it, picking Tokyo
  // by hand would still read "detected from your device", which is simply
  // false.
  const [zoneSource, setZoneSource] = useState<"auto" | "manual">("auto");
  const [zoneInput, setZoneInput] = useState("");
  const [zoneError, setZoneError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setViewerZone(detected);
    } catch {
      // Detection failing just means we stay on New York — never block the page over it.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/book/slots")
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) setLoadError(body.error ?? "Couldn't load available times.");
        else {
          setLoadError(null);
          setData(body);
        }
      })
      .catch(() => !cancelled && setLoadError("Couldn't load available times."));
    return () => {
      cancelled = true;
    };
  }, []);

  // A duration switch can leave a previously-selected start time invalid (a
  // 3-hour run that doesn't fit where a 1-hour one did) — drop it rather than
  // silently submit a stale slot.
  useEffect(() => {
    setSelected(null);
  }, [hours]);

  const loadingStage = useElapsedStage(!data && !loadError, [
    { afterMs: 0, text: "Checking Alex's calendar…" },
    { afterMs: 3000, text: "Still checking — one calendar can be a little slow…" },
    { afterMs: 9000, text: "Almost there…" },
  ]);
  const submitStage = useElapsedStage(submitting, [
    { afterMs: 0, text: "Sending your request…" },
    { afterMs: 2500, text: "Still sending — please don't refresh the page…" },
    { afterMs: 7000, text: "Almost done — please don't refresh…" },
  ]);

  // A real safeguard, not just a suggestion: while the request is in flight,
  // an accidental refresh or tab close would abandon a request that may have
  // already partly succeeded server-side (the request row can be written
  // before both confirmation emails finish sending). The browser's built-in
  // "leave site?" prompt only needs to survive for the few seconds this is
  // true, and it clears itself the moment submit() finishes either way.
  useEffect(() => {
    if (!submitting) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitting]);

  function applyZoneInput() {
    const candidate = zoneInput.trim();
    if (!candidate) return;
    try {
      // Throws on anything Intl doesn't recognize as a real IANA zone —
      // the only validation that matters, since there's no fixed list to
      // check against.
      Intl.DateTimeFormat(undefined, { timeZone: candidate });
      setViewerZone(candidate);
      setZoneSource("manual");
      setZoneError(null);
      setZoneInput("");
    } catch {
      setZoneError(`"${candidate}" isn't a time zone I recognize — try a format like "Europe/London" or "Asia/Tokyo".`);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/book/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: selected, name, email, note, hours, rate }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSubmitError(body.error ?? "Something went wrong.");
        // A taken slot means our cached list is stale — reload it so they see
        // what's actually left instead of retrying into the same 409.
        if (res.status === 409) {
          setSelected(null);
          fetch("/api/book/slots")
            .then((r) => r.json())
            .then((b) => b.slotsByHours && setData(b))
            .catch(() => {});
        }
      } else {
        setDone(true);
      }
    } catch {
      setSubmitError("Network hiccup — try that again?");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal/40 bg-teal/10 p-6 text-snow">
        <strong>Request sent.</strong>
        <p className="mt-2 leading-relaxed text-mist">
          Nothing is booked yet and you haven&apos;t been charged. Alex reviews these himself,
          usually within a day — you&apos;ll get an email either way. Check your inbox for the
          confirmation.
        </p>
      </div>
    );
  }

  const durations = data?.durations ?? [];
  const active = durations.find((d) => d.hours === hours);
  const rawSlots = data?.slotsByHours?.[hours] ?? [];
  const now = new Date();
  const viewerLabel = zoneLabel(now, viewerZone);
  const viewerIsNewYork = viewerZone === BOOKING_TIMEZONE_ID;

  // Every slot's day/time re-rendered in whichever zone the visitor picked —
  // computed here, client-side, from the raw instant the server sent. The
  // server only ever thinks in America/New_York (that's where the business
  // hours and the calendar live); which zone a VISITOR wants to read those
  // times in is display-only, so it never needs another network round-trip.
  const grouped = rawSlots.reduce<Record<string, { start: string; time: string }[]>>((acc, slot) => {
    const start = new Date(slot.start);
    const day = formatSlotDay(start, viewerZone);
    const time = formatSlotTime(start, viewerZone);
    (acc[day] ??= []).push({ start: slot.start, time });
    return acc;
  }, {});

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-mist">
          1. Which rate applies to you?
        </legend>
        <p className="mt-1 text-sm text-mist/70">Students and freelancers pay half.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(data?.rates ?? []).map((r) => {
            const on = r.id === rate;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRate(r.id)}
                aria-pressed={on}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  on
                    ? "border-teal bg-teal/20 text-snow"
                    : "border-white/15 bg-white/5 text-mist hover:border-teal/50 hover:text-snow"
                }`}
              >
                <span className="block text-sm font-semibold">{r.label}</span>
                {r.note && <span className="block text-xs opacity-80">{r.note}</span>}
              </button>
            );
          })}
          {(data?.rates ?? []).length === 0 && <p className="text-mist">Loading…</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-mist">
          2. How long do you need?
        </legend>
        <p className="mt-1 text-sm text-mist/70">The whole block reserved just for you.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {durations.map((d) => {
            const on = d.hours === hours;
            const price = d.prices[rate] ?? d.standardPriceCents;
            return (
              <button
                key={d.hours}
                type="button"
                onClick={() => setHours(d.hours)}
                aria-pressed={on}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  on
                    ? "border-teal bg-teal/20 text-snow"
                    : "border-white/15 bg-white/5 text-mist hover:border-teal/50 hover:text-snow"
                }`}
              >
                <span className="block text-sm font-semibold">{d.label}</span>
                <span className="block text-xs opacity-80">
                  {price !== d.standardPriceCents && (
                    <span className="mr-1 line-through opacity-60">
                      {dollars(d.standardPriceCents)}
                    </span>
                  )}
                  {dollars(price)}
                </span>
              </button>
            );
          })}
          {durations.length === 0 && <p className="text-mist">Loading…</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wide text-mist">
          3. Pick a start time
        </legend>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist/70">
          <span>
            Showing times in <strong className="text-snow">{viewerZone}</strong> — {viewerLabel}
            {zoneSource === "manual"
              ? " — your choice."
              : viewerIsNewYork
                ? " — Alex's own zone."
                : " — detected from your device."}
          </span>
          {!viewerIsNewYork && (
            <button
              type="button"
              onClick={() => {
                setViewerZone(BOOKING_TIMEZONE_ID);
                setZoneSource("manual");
              }}
              className="text-teal hover:underline"
            >
              Show {BOOKING_ZONE_LABEL} instead
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={zoneInput}
            onChange={(e) => setZoneInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyZoneInput();
              }
            }}
            placeholder="Or type a time zone, e.g. Europe/London"
            className="w-64 max-w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-snow outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={applyZoneInput}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-mist hover:border-teal/50 hover:text-snow"
          >
            Use this zone
          </button>
        </div>
        {zoneError && <p className="mt-1 text-sm text-rose-300">{zoneError}</p>}

        {loadError && (
          <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-5 text-snow">
            <strong>Can&apos;t load times right now.</strong>
            <p className="mt-2 leading-relaxed text-mist">{loadError}</p>
          </div>
        )}

        {!loadError && !data && (
          <div className="mt-4">
            <ProgressBar label={loadingStage} />
          </div>
        )}

        {!loadError && data && rawSlots.length === 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-snow">
            <strong>Nothing open at that length in the next few weeks.</strong>
            <p className="mt-2 leading-relaxed text-mist">
              Try a shorter block, or email{" "}
              <a className="text-teal hover:underline" href="mailto:info@alexcoulombepresents.com">
                info@alexcoulombepresents.com
              </a>{" "}
              and Alex will find you a time directly.
            </p>
          </div>
        )}

        {!loadError && data && rawSlots.length > 0 && (
          <div className="mt-4 space-y-5">
            {Object.entries(grouped).map(([day, daySlots]) => (
              <div key={day}>
                <p className="font-mono text-xs text-teal">{day}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const on = selected === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => setSelected(slot.start)}
                        aria-pressed={on}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          on
                            ? "border-teal bg-teal/20 text-snow"
                            : "border-white/15 bg-white/5 text-mist hover:border-teal/50 hover:text-snow"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-mist">
          4. Who are you?
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-mist">Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-snow outline-none focus:border-teal"
            />
          </label>
          <label className="block">
            <span className="text-sm text-mist">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-snow outline-none focus:border-teal"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-mist">What do you want to cover? (optional)</span>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-snow outline-none focus:border-teal"
          />
        </label>
      </fieldset>

      {submitError && <p className="text-sm text-rose-300">{submitError}</p>}

      {submitting ? (
        <div className="rounded-xl border border-teal/30 bg-teal/[0.06] p-4">
          <ProgressBar label={submitStage} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!selected}
            className="rounded-xl bg-teal px-5 py-3 font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request this time
          </button>
          <p className="text-sm text-mist">
            {active
              ? `Nothing is charged now — ${dollars(active.prices[rate] ?? active.standardPriceCents)} is due only after Alex confirms he can help.`
              : "Nothing is charged now — payment is only due after Alex confirms he can help."}
          </p>
        </div>
      )}
    </form>
  );
}
