"use client";

import { useEffect, useState } from "react";
import {
  ENGAGEMENT_OPTIONS,
  TOPIC_OPTIONS,
  AI_STANCE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  type EngagementOption,
  type TopicOption,
  type AiStanceOption,
  type SkillLevelOption,
} from "@/lib/trainingSurvey";

type Counts = Record<string, number>;

type SurveyResponse = {
  ok: boolean;
  engagement?: { option: string; count: number }[];
  topics?: { option: string; count: number }[];
  aiStance?: { option: string; count: number }[];
  skillLevel?: { option: string; count: number }[];
  total?: number;
  error?: string;
};

function toCounts(rows: { option: string; count: number }[] | undefined): Counts {
  const out: Counts = {};
  for (const r of rows ?? []) out[r.option] = r.count;
  return out;
}

type AllCounts = { engagement: Counts; topics: Counts; aiStance: Counts; skillLevel: Counts };
const EMPTY_COUNTS: AllCounts = { engagement: {}, topics: {}, aiStance: {}, skillLevel: {} };

function ResultsBlock({
  title,
  options,
  counts,
}: {
  title: string;
  options: Record<string, string>;
  counts: Counts;
}) {
  const entries = Object.entries(options) as [string, string][];
  const max = Math.max(1, ...entries.map(([slug]) => counts[slug] ?? 0));
  const sorted = [...entries].sort(([a], [b]) => (counts[b] ?? 0) - (counts[a] ?? 0));
  const total = entries.reduce((sum, [slug]) => sum + (counts[slug] ?? 0), 0);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-mist">{title}</p>
      <div className="mt-3 flex flex-col gap-3">
        {sorted.map(([slug, label], i) => {
          const count = counts[slug] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = Math.max(3, Math.round((count / max) * 100));
          return (
            <div key={slug}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={i === 0 && count > 0 ? "font-bold text-snow" : "text-mist"}>{label}</span>
                <span className="font-mono text-xs text-mist">
                  {count} · {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-panel">
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
    </div>
  );
}

function MultiSelect<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: Record<T, string>;
  selected: T[];
  onToggle: (slug: T) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {(Object.entries(options) as [T, string][]).map(([slug, label]) => {
        const isSelected = selected.includes(slug);
        return (
          <button
            type="button"
            key={slug}
            onClick={() => onToggle(slug)}
            aria-pressed={isSelected}
            className={`rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${
              isSelected
                ? "border-teal bg-teal/10 text-snow"
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
  );
}

function SingleSelect<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Record<T, string>;
  selected: T | null;
  onSelect: (slug: T) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {(Object.entries(options) as [T, string][]).map(([slug, label]) => {
        const isSelected = selected === slug;
        return (
          <button
            type="button"
            key={slug}
            onClick={() => onSelect(slug)}
            aria-pressed={isSelected}
            className={`rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${
              isSelected
                ? "border-teal bg-teal/10 text-snow"
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
  );
}

export default function TrainingSurveyForm() {
  const [engagement, setEngagement] = useState<EngagementOption[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [aiStance, setAiStance] = useState<AiStanceOption | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevelOption | null>(null);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [human, setHuman] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [counts, setCounts] = useState<AllCounts>(EMPTY_COUNTS);
  const [total, setTotal] = useState(0);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/training-survey")
      .then((r) => r.json())
      .then((data: SurveyResponse) => {
        if (cancelled || !data.ok) return;
        setCounts({
          engagement: toCounts(data.engagement),
          topics: toCounts(data.topics),
          aiStance: toCounts(data.aiStance),
          skillLevel: toCounts(data.skillLevel),
        });
        setTotal(data.total ?? 0);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingResults(false));
    return () => {
      cancelled = true;
    };
  }, [sent]);

  function toggle<T extends string>(setter: React.Dispatch<React.SetStateAction<T[]>>, slug: T) {
    setter((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  const complete = engagement.length > 0 && topics.length > 0 && aiStance !== null && skillLevel !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!complete) {
      setError("Please answer all four questions.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/training-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, engagement, topics, aiStance, skillLevel, honeypot, human }),
      });
      const data: SurveyResponse = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Try emailing directly.");
      } else {
        setCounts({
          engagement: toCounts(data.engagement),
          topics: toCounts(data.topics),
          aiStance: toCounts(data.aiStance),
          skillLevel: toCounts(data.skillLevel),
        });
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
      <div className="flex flex-col gap-8">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-3xl">✦</p>
          <p className="mt-3 font-bold">Thanks — that&apos;s exactly what I needed.</p>
          <p className="mt-1.5 text-sm text-mist">Here&apos;s where things stand so far:</p>
        </div>
        <div className="glass grid gap-8 rounded-2xl p-6 sm:grid-cols-2">
          <ResultsBlock title="How you'd engage" options={ENGAGEMENT_OPTIONS} counts={counts.engagement} />
          <ResultsBlock title="Topics wanted" options={TOPIC_OPTIONS} counts={counts.topics} />
          <ResultsBlock title="Learning AI" options={AI_STANCE_OPTIONS} counts={counts.aiStance} />
          <ResultsBlock title="Skill level" options={SKILL_LEVEL_OPTIONS} counts={counts.skillLevel} />
        </div>
        <p className="text-center font-mono text-xs text-mist">
          {total} response{total === 1 ? "" : "s"} so far
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8 text-left">
        <div>
          <p className="mb-3 font-bold">
            1. How would you like to engage with paid classes?{" "}
            <span className="font-normal text-mist">— select all that apply</span>
          </p>
          <MultiSelect options={ENGAGEMENT_OPTIONS} selected={engagement} onToggle={(s) => toggle(setEngagement, s)} />
        </div>

        <div>
          <p className="mb-3 font-bold">
            2. What topics are you most eager to learn right now?{" "}
            <span className="font-normal text-mist">— select all that apply</span>
          </p>
          <MultiSelect options={TOPIC_OPTIONS} selected={topics} onToggle={(s) => toggle(setTopics, s)} />
        </div>

        <div>
          <p className="mb-3 font-bold">3. How are you feeling about learning AI?</p>
          <SingleSelect options={AI_STANCE_OPTIONS} selected={aiStance} onSelect={setAiStance} />
        </div>

        <div>
          <p className="mb-3 font-bold">4. As an Unreal Engine user, would you consider yourself:</p>
          <SingleSelect options={SKILL_LEVEL_OPTIONS} selected={skillLevel} onSelect={setSkillLevel} />
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

        <div>
          <label className="mb-2 block text-sm text-mist" htmlFor="training-survey-email">
            Email (optional) — only if you want a direct follow-up
          </label>
          <input
            id="training-survey-email"
            className={field}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

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
            disabled={submitting || !complete}
            className="rounded-full bg-snow px-6 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : "Submit →"}
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

      {!loadingResults && total > 0 && (
        <div className="glass grid gap-8 rounded-2xl p-6 sm:grid-cols-2">
          <p className="col-span-full font-mono text-xs uppercase tracking-widest text-teal">
            Live results · {total} response{total === 1 ? "" : "s"} so far
          </p>
          <ResultsBlock title="How you'd engage" options={ENGAGEMENT_OPTIONS} counts={counts.engagement} />
          <ResultsBlock title="Topics wanted" options={TOPIC_OPTIONS} counts={counts.topics} />
          <ResultsBlock title="Learning AI" options={AI_STANCE_OPTIONS} counts={counts.aiStance} />
          <ResultsBlock title="Skill level" options={SKILL_LEVEL_OPTIONS} counts={counts.skillLevel} />
        </div>
      )}
    </div>
  );
}
