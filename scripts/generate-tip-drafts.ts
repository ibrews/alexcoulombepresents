// ── #uetips draft generator — no Sam required ───────────────────────────────
// Sources tip candidates from lib/data.ts's `repos` (real, Alex/Agile-Lens-
// authored project write-ups already public on the site — not Sam's KB, not
// Sam's Slack bot) instead of anything that depends on a specific machine
// being up. Two independent, cloud-only checks run before anything is queued
// for the existing Telegram review step:
//   1. Gemini (grounded search) drafts a tweet-sized tip from real repo
//      content, then fact-checks any concrete technical claim in its own
//      draft against real docs.
//   2. Groq (a different model family entirely) reviews the drafted tip +
//      fact-check summary and gives an independent accept/reject verdict.
// Only drafts that clear BOTH land in ue_tip_queue via the existing
// /api/admin/queue-tip-drafts endpoint — nothing here posts directly, and
// the Telegram approve/reject step still has the final say either way.
//
// Run: GEMINI_API_KEY=... GROQ_API_KEY=... CRON_SECRET=... npx tsx scripts/generate-tip-drafts.ts [count]
// (see .github/workflows/generate-tip-drafts.yml for the no-Sam-needed
// scheduled/on-demand runner)

import { repos } from "../lib/data";

const SITE_URL = process.env.SITE_URL ?? "https://www.alexcoulombepresents.com";
const COUNT = parseInt(process.argv[2] ?? "5", 10);
// Bump this whenever a new UE release ships — used both to tell the drafter
// what "the latest build" currently is, and to flag when a version-specific
// claim needs a second look (a KB doc pinned to an older release may be
// stale by the time this generator runs against it).
const CURRENT_UE_VERSION = "5.8.1";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

async function geminiGenerate(prompt: string, ground: boolean): Promise<string> {
  const key = requireEnv("GEMINI_API_KEY");
  const body: Record<string, unknown> = { contents: [{ parts: [{ text: prompt }] }] };
  if (ground) body.tools = [{ google_search: {} }];
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": key },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!res.ok || !text) throw new Error(`Gemini call failed: ${JSON.stringify(json)}`);
  return text as string;
}

async function groqVerdict(prompt: string): Promise<string> {
  const key = requireEnv("GROQ_API_KEY");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!res.ok || !text) throw new Error(`Groq call failed: ${JSON.stringify(json)}`);
  return text as string;
}

// Excludes categories that produce off-topic drafts for a #uetips account —
// caught empirically: a claude-usage-audit ("AI & Agents") draft was
// perfectly accurate but had nothing to do with Unreal Engine, and Groq
// correctly rejected it. Better to not generate it in the first place.
const OFF_TOPIC_CATEGORIES = new Set(["AI & Agents", "Tools"]);

// Repeat-avoidance — found empirically 2026-08-03: with no exclusion, a
// second batch picked unreal-mac-getstats-fix again and produced a
// near-duplicate of an already-approved draft. `source` on every row this
// generator writes is tagged `lib/data.ts repos["<slug>"]`, so recovering
// which slugs have already been used is just parsing that back out of
// whatever's already in the queue (any status — pending, approved,
// rejected, or posted all count as "already tried this one recently").
async function alreadyUsedSlugs(cronSecret: string): Promise<Set<string>> {
  const res = await fetch(`${SITE_URL}/api/admin/tip-queue-status`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch tip queue status: ${res.status}`);
  const { tips } = (await res.json()) as { tips: { source: string | null }[] };
  const slugs = new Set<string>();
  for (const tip of tips) {
    const match = tip.source?.match(/repos\["([^"]+)"\]/);
    if (match) slugs.add(match[1]);
  }
  return slugs;
}

function pickRandomRepos(n: number, exclude: Set<string>) {
  const eligible = repos.filter(
    (r) =>
      r.highlights.length > 0 &&
      r.story.length > 100 &&
      !OFF_TOPIC_CATEGORIES.has(r.category) &&
      !exclude.has(r.slug)
  );
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function draftFromRepo(repo: (typeof repos)[number]) {
  const source = `${repo.name} — ${repo.tagline}\n\n${repo.story}\n\nHighlights:\n${repo.highlights.join("\n")}`;

  const draft = await geminiGenerate(
    `Here is a real, already-shipped Unreal Engine / XR project write-up by Alex Coulombe / Agile Lens:\n\n${source}\n\n` +
      `Write ONE single Unreal Engine tip as a tweet, under 260 characters INCLUDING a trailing " #uetips" hashtag. ` +
      `It must be a concrete, actionable technique someone could actually apply — not a vague summary of the project. ` +
      `Only state facts that are directly supported by the text above; do not invent API names, node names, or numbers ` +
      `that aren't in the source.\n\n` +
      `Current latest Unreal Engine release is ${CURRENT_UE_VERSION}. Follow this version-tagging rule:\n` +
      `- A bug workaround still broken as of ${CURRENT_UE_VERSION} (started at some version and never got fixed): ` +
      `use "+" from where it started, e.g. "5.6.1+" — don't enumerate every affected version individually, since ` +
      `that list silently goes stale the moment a new point release ships and is also still broken.\n` +
      `- A bug workaround that's bounded (affects some versions but is fixed by ${CURRENT_UE_VERSION}, or only ever ` +
      `affected a specific closed range): name the exact affected version(s) or range, e.g. "5.6.1/5.7" or "5.6 only".\n` +
      `- A relatively new feature that was introduced in a specific version and is still supported today: use a ` +
      `"+" minimum-version tag, e.g. "UE5.7+" — never bare "UE5.7", which wrongly implies it's limited to that one ` +
      `version.\n` +
      `- A technique that's old/foundational and applies broadly across many versions: no version tag at all, or ` +
      `just "UE5".\n` +
      `Most techniques fall in the third bucket — don't reach for a version number by default.\n\n` +
      `Reply with ONLY the tweet text, nothing else.`,
    false
  );
  const tweetText = draft.trim().replace(/^["']|["']$/g, "");

  const factCheck = await geminiGenerate(
    `A tip for a public Unreal Engine tips account makes this claim:\n\n"${tweetText}"\n\n` +
      `Here is the original source material it was drawn from (a real, already-shipped Agile Lens / Alex Coulombe project):\n\n${source}\n\n` +
      `Split any concrete technical claims in the tip into two kinds, and check each differently:\n` +
      `1. Claims about STOCK Unreal Engine features, APIs, nodes, or CVars (things Epic ships) — verify these against ` +
      `real, current official Unreal Engine documentation via search.\n` +
      `2. Claims about Alex/Agile Lens's OWN custom-built tools, systems, or project-specific numbers (things that ` +
      `would never appear in Epic's public docs because they're proprietary) — these only need to match what the ` +
      `source material above actually says, not public documentation.\n\n` +
      `End your reply with exactly one line, verbatim: "OVERALL: PASS" if every claim checks out under the ` +
      `appropriate standard above, or "OVERALL: FAIL" if any claim is actually wrong or unsupported by the source.`,
    true
  );

  return { tweetText, factCheck, source: `lib/data.ts repos["${repo.slug}"]` };
}

async function main() {
  const cronSecret = requireEnv("CRON_SECRET");
  const used = await alreadyUsedSlugs(cronSecret);
  console.log(`Excluding ${used.size} already-used repo(s): ${[...used].join(", ") || "(none yet)"}`);

  const candidates = pickRandomRepos(COUNT, used);
  if (candidates.length === 0) throw new Error("No eligible, not-yet-used repos found in lib/data.ts");

  const drafts: { text: string; source: string }[] = [];
  const rejected: { text: string; reason: string }[] = [];

  for (const repo of candidates) {
    console.log(`\n=== ${repo.slug} ===`);
    const { tweetText, factCheck, source } = await draftFromRepo(repo);
    console.log("Draft:", tweetText);
    console.log("Fact-check:", factCheck.slice(0, 300));

    if (!/OVERALL:\s*PASS/i.test(factCheck)) {
      console.log("→ Gemini fact-check did not pass, skipping.");
      rejected.push({ text: tweetText, reason: "gemini-fact-check" });
      continue;
    }

    const verdictText = await groqVerdict(
      `A tip is being considered for a public Unreal Engine tips X account. Original source material:\n\n${repo.story}\n\n` +
        `Proposed tweet: "${tweetText}"\n\nA separate fact-check pass said: "${factCheck.slice(0, 800)}"\n\n` +
        `As an independent reviewer, does the tweet accurately reflect the source material with no invented details? ` +
        `Answer with ACCEPT or REJECT on the first line, then a one-sentence reason.`
    );
    console.log("Groq verdict:", verdictText.slice(0, 200));

    if (!/^ACCEPT/i.test(verdictText.trim())) {
      console.log("→ Groq rejected, skipping.");
      rejected.push({ text: tweetText, reason: "groq-verdict" });
      continue;
    }

    if (tweetText.length > 280) {
      console.log("→ Over 280 chars, skipping.");
      rejected.push({ text: tweetText, reason: "too-long" });
      continue;
    }

    drafts.push({ text: tweetText, source: `${source}, Gemini-drafted + Gemini-fact-checked + Groq-reviewed` });
  }

  console.log(`\n${drafts.length} draft(s) passed both checks, ${rejected.length} rejected.`);
  if (drafts.length === 0) {
    console.log("Nothing to queue this run.");
    return;
  }

  const res = await fetch(`${SITE_URL}/api/admin/queue-tip-drafts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cronSecret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ drafts }),
  });
  const json = await res.json();
  console.log("Queue response:", JSON.stringify(json));
  if (!res.ok) throw new Error(`Queueing failed: ${JSON.stringify(json)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
