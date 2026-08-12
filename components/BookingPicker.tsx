"use client";

import { useEffect, useState } from "react";

type Slot = { start: string; end: string; label: string; day: string; time: string };
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
  const slots = data?.slotsByHours?.[hours] ?? [];

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
        {data && (
          <p className="mt-1 text-sm text-mist/70">All times {data.timeZone.replace("_", " ")}.</p>
        )}

        {loadError && (
          <div className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-400/10 p-5 text-snow">
            <strong>Can&apos;t load times right now.</strong>
            <p className="mt-2 leading-relaxed text-mist">{loadError}</p>
          </div>
        )}

        {!loadError && !data && <p className="mt-4 text-mist">Loading open times…</p>}

        {!loadError && data && slots.length === 0 && (
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

        {!loadError && data && slots.length > 0 && (
          <div className="mt-4 space-y-5">
            {Object.entries(
              slots.reduce<Record<string, Slot[]>>((acc, slot) => {
                (acc[slot.day] ??= []).push(slot);
                return acc;
              }, {})
            ).map(([day, daySlots]) => (
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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={!selected || submitting}
          className="rounded-xl bg-teal px-5 py-3 font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Sending…" : "Request this time"}
        </button>
        <p className="text-sm text-mist">
          {active
            ? `Nothing is charged now — ${dollars(active.prices[rate] ?? active.standardPriceCents)} is due only after Alex confirms he can help.`
            : "Nothing is charged now — payment is only due after Alex confirms he can help."}
        </p>
      </div>
    </form>
  );
}
