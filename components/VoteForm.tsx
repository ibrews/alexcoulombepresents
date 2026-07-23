"use client";

import { useEffect, useState } from "react";
import { VOTE_TOPICS, MAX_TOPICS_PER_VOTE, type VoteTopic } from "@/lib/vote";

type Counts = Partial<Record<VoteTopic, number>>;

type VoteResponse = {
  ok: boolean;
  counts?: { topic: string; count: number }[];
  total?: number;
  error?: string;
};

function toCounts(rows: { topic: string; count: number }[] | undefined): Counts {
  const out: Counts = {};
  for (const r of rows ?? []) {
    if (r.topic in VOTE_TOPICS) out[r.topic as VoteTopic] = r.count;
  }
  return out;
}

function Results({ counts, total }: { counts: Counts; total: number }) {
  const max = Math.max(1, ...Object.values(counts).map((n) => n ?? 0));
  const topicList = Object.entries(VOTE_TOPICS) as [VoteTopic, string][];
  const sorted = [...topicList].sort(([a], [b]) => (counts[b] ?? 0) - (counts[a] ?? 0));

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-teal">Live results</p>
        <p className="font-mono text-xs text-mist">
          {total} vote{total === 1 ? "" : "s"} so far
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {sorted.map(([slug, label], i) => {
          const count = counts[slug] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = Math.max(3, Math.round((count / max) * 100));
          return (
            <div key={slug}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={i === 0 && count > 0 ? "font-bold text-snow" : "text-mist"}>
                  {label}
                </span>
                <span className="font-mono text-xs text-mist">
                  {count} · {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    background: "linear-gradient(90deg, var(--color-teal), var(--color-grape))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {sorted.length > 0 && (counts[sorted[0][0]] ?? 0) > 0 && (
        <p className="mt-5 text-sm text-mist">
          Right now <span className="font-bold text-snow">{sorted[0][1]}</span> is winning — the
          most-requested topic becomes the September cohort.
        </p>
      )}
    </div>
  );
}

export default function VoteForm() {
  const [selected, setSelected] = useState<VoteTopic[]>([]);
  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [human, setHuman] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<Counts>({});
  const [total, setTotal] = useState(0);
  const [loadingResults, setLoadingResults] = useState(true);

  // Anyone can see live results, before or after voting.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/vote")
      .then((r) => r.json())
      .then((data: VoteResponse) => {
        if (cancelled || !data.ok) return;
        setCounts(toCounts(data.counts));
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingResults(false));
    return () => {
      cancelled = true;
    };
  }, [sent]);

  function toggleTopic(slug: VoteTopic) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_TOPICS_PER_VOTE) return prev;
      return [...prev, slug];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (selected.length === 0) {
      setError("Pick at least one topic.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics: selected, subscribe, honeypot, human }),
      });
      const data: VoteResponse = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Try emailing directly.");
      } else {
        setCounts(toCounts(data.counts));
        setTotal(data.total ?? 0);
        setSent(true);
      }
    } catch {
      setError("Couldn't reach the server. Try emailing directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-snow placeholder:text-mist/50 focus:border-teal/60 focus:outline-none transition-colors";

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-3xl">✦</p>
          <p className="mt-3 font-bold">Vote recorded — thanks.</p>
          <p className="mt-1.5 text-sm text-mist">
            A vote is a promise I&apos;ll actually build it. Here&apos;s where things stand:
          </p>
        </div>
        <Results counts={counts} total={total} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-mist">
            Pick up to {MAX_TOPICS_PER_VOTE}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(VOTE_TOPICS) as [VoteTopic, string][]).map(([slug, label]) => {
              const isSelected = selected.includes(slug);
              const disabled = !isSelected && selected.length >= MAX_TOPICS_PER_VOTE;
              return (
                <button
                  type="button"
                  key={slug}
                  disabled={disabled}
                  onClick={() => toggleTopic(slug)}
                  aria-pressed={isSelected}
                  className={`rounded-2xl border p-4 text-left text-sm font-semibold transition-all ${
                    isSelected
                      ? "border-teal bg-teal/10 text-snow"
                      : disabled
                        ? "border-line text-mist/40 cursor-not-allowed opacity-50"
                        : "glass border-line text-mist hover:border-teal/50 hover:text-snow"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    {label}
                    {isSelected && <span className="text-teal">✓</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Honeypot — invisible to humans, bots fill it in */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: "absolute", opacity: 0, height: 0, pointerEvents: "none" }}
        />

        <input
          className={field}
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Your email"
        />

        <label className="flex cursor-pointer items-center gap-2.5 select-none">
          <input
            type="checkbox"
            checked={subscribe}
            onChange={(e) => setSubscribe(e.target.checked)}
            className="h-4 w-4 accent-teal"
          />
          <span className="text-sm text-mist">Also get class announcements</span>
        </label>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex cursor-pointer items-center gap-2.5 select-none">
            <input
              type="checkbox"
              checked={human}
              onChange={(e) => setHuman(e.target.checked)}
              className="h-4 w-4 accent-teal"
            />
            <span className="text-sm text-mist">I&apos;m not a robot</span>
          </label>
          <button
            type="submit"
            disabled={submitting || selected.length === 0}
            className="rounded-full bg-snow px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Casting vote…" : "Cast my vote →"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-400">
            {error}{" "}
            <a className="underline" href="mailto:info@alexcoulombepresents.com">
              Email directly →
            </a>
          </p>
        )}
      </form>

      {!loadingResults && total > 0 && <Results counts={counts} total={total} />}
    </div>
  );
}
