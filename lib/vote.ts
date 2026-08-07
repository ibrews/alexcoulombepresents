// Topics up for vote at /vote — the site's "what should Alex teach next?"
// poll. Keep this list in sync with app/vote/page.tsx.

export const VOTE_TOPICS = {
  blueprints: "Blueprints & Interactivity",
  vr: "VR / Vision Pro",
  metahumans: "MetaHumans",
  archviz: "Archviz",
  "ai-workflows": "AI-assisted Unreal workflows",
  "virtual-production": "Virtual Production",
  pcg: "Procedural Content Generation (PCG)",
  mocap: "Motion Capture",
  "unity-to-unreal": "Unity to Unreal",
  "export-pipelines": "Exporting out of Unreal (USD, GLB, RealityKit…)",
} as const;

export type VoteTopic = keyof typeof VOTE_TOPICS;

export function isVoteTopic(v: unknown): v is VoteTopic {
  return typeof v === "string" && v in VOTE_TOPICS;
}

export const MAX_TOPICS_PER_VOTE = 2;

// ── Free-text "Other" write-in ──────────────────────────────────────────────
// A write-in topic rides in the same `topics: string[]` column as the fixed
// ones (no schema change) — it's just a string prefixed so the API and the
// results UI can tell it apart from a known VOTE_TOPICS slug. Once someone
// votes for one, it shows up as its own bar in the live results for
// everyone else, same as any fixed topic — that's the whole point of a
// write-in that isn't just a suggestion box.
const OTHER_TOPIC_PREFIX = "other:";
const MAX_OTHER_TOPIC_LENGTH = 60;

export function isOtherTopic(topic: string): boolean {
  return topic.startsWith(OTHER_TOPIC_PREFIX) && topic.length > OTHER_TOPIC_PREFIX.length;
}

export function otherTopicLabel(topic: string): string {
  return topic.slice(OTHER_TOPIC_PREFIX.length);
}

// Collapses all whitespace (including tabs/newlines — \s covers those) down
// to single spaces, trims, and caps length. Returns null if nothing usable
// is left, which the caller treats as "no write-in" rather than an error —
// an empty Other field just means it should behave as unselected.
export function sanitizeOtherTopic(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, MAX_OTHER_TOPIC_LENGTH);
}

export function encodeOtherTopic(sanitizedText: string): string {
  return `${OTHER_TOPIC_PREFIX}${sanitizedText}`;
}
