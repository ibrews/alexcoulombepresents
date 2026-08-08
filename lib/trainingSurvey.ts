// ── Training survey — /training#poll ────────────────────────────────────────
// A short pulse-check on what to actually build for paid classes, since the
// original fixed 4-week cohort plan drew zero signups. Keep option keys
// stable once real responses exist — they're stored as-is in the DB.

export const ENGAGEMENT_OPTIONS = {
  "single-serving": "Single-serving — drop into any class if the topic's relevant to me",
  "packaged-curriculum": "Packaged curriculums — classes that build on each other over several weeks",
  subscription: "Monthly subscription — as much live + recorded access as possible",
} as const;

export type EngagementOption = keyof typeof ENGAGEMENT_OPTIONS;

// Topic selection used to live here too (question 2), but it duplicated
// /vote's weighted topic voting — removed in favor of pointing to /vote,
// which is the one place topics are actually decided now.

export const AI_STANCE_OPTIONS = {
  "only-if-relevant": "Only when directly relevant to Unreal",
  "all-workflows": "All workflows, big and small — even outside of Unreal",
  "no-ai": "I don't want to hear those two letters spoken together",
} as const;

export type AiStanceOption = keyof typeof AI_STANCE_OPTIONS;

export const SKILL_LEVEL_OPTIONS = {
  newbie: "Newbie",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

export type SkillLevelOption = keyof typeof SKILL_LEVEL_OPTIONS;

export function isEngagementOption(v: unknown): v is EngagementOption {
  return typeof v === "string" && v in ENGAGEMENT_OPTIONS;
}
export function isAiStanceOption(v: unknown): v is AiStanceOption {
  return typeof v === "string" && v in AI_STANCE_OPTIONS;
}
export function isSkillLevelOption(v: unknown): v is SkillLevelOption {
  return typeof v === "string" && v in SKILL_LEVEL_OPTIONS;
}
