// Topics up for vote at /vote — the site's "what should Alex teach next?"
// poll. Keep this list in sync with app/vote/page.tsx.

export const VOTE_TOPICS = {
  blueprints: "Blueprints & Interactivity",
  vr: "VR / Vision Pro",
  metahumans: "MetaHumans",
  archviz: "Archviz",
  "ai-workflows": "AI-assisted Unreal workflows",
  "virtual-production": "Virtual Production",
} as const;

export type VoteTopic = keyof typeof VOTE_TOPICS;

export function isVoteTopic(v: unknown): v is VoteTopic {
  return typeof v === "string" && v in VOTE_TOPICS;
}

export const MAX_TOPICS_PER_VOTE = 2;
