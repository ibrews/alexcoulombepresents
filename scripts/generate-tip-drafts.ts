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
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!res.ok || !text) throw new Error(`Groq call failed: ${JSON.stringify(json)}`);
  return text as string;
}

function pickRandomRepos(n: number) {
  const eligible = repos.filter((r) => r.highlights.length > 0 && r.story.length > 100);
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
      `that aren't in the source. Reply with ONLY the tweet text, nothing else.`,
    false
  );
  const tweetText = draft.trim().replace(/^["']|["']$/g, "");

  const factCheck = await geminiGenerate(
    `Fact-check every concrete technical claim (API/node/property names, specific numbers, specific behavior) in this ` +
      `proposed Unreal Engine tip against real, current documentation and sources:\n\n"${tweetText}"\n\n` +
      `State plainly whether each claim is REAL/VERIFIED or UNVERIFIED/WRONG, citing what you found.`,
    true
  );

  return { tweetText, factCheck, source: `lib/data.ts repos["${repo.slug}"]` };
}

async function main() {
  const candidates = pickRandomRepos(COUNT);
  if (candidates.length === 0) throw new Error("No eligible repos found in lib/data.ts");

  const cronSecret = requireEnv("CRON_SECRET");
  const drafts: { text: string; source: string }[] = [];
  const rejected: { text: string; reason: string }[] = [];

  for (const repo of candidates) {
    console.log(`\n=== ${repo.slug} ===`);
    const { tweetText, factCheck, source } = await draftFromRepo(repo);
    console.log("Draft:", tweetText);
    console.log("Fact-check:", factCheck.slice(0, 300));

    if (/UNVERIFIED|WRONG|cannot confirm|not (a real|verified)/i.test(factCheck)) {
      console.log("→ Gemini fact-check flagged an issue, skipping.");
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
