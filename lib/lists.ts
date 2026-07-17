// Single source of truth for every signup list on the site.
// Each key is a URL-safe slug; the label is used in notification emails,
// admin exports, and as the human-readable name when broadcasting.
export const LISTS = {
  ai: "AI training",
  unreal: "Unreal training",
  forage: "Forage waitlist",
  "unrealitykit-bridge": "UnRealityKit Bridge",
  pinchwork: "Pinchwork",
  "unreal-visionos": "Unreal × visionOS",
  lab: "The Lab — early access",
  skills: "Custom AI skill",
  store: "Store interest",
  newsletter: "General newsletter",
  members: "Members — founding waitlist",
  "team-training": "Team / studio training",
  "legacy-interest": "Old training interest form (imported)",
} as const;

// Human-readable "why you're receiving this" line per list, used as the
// default footer reason in scripts/broadcast.mjs. Keep these honest and
// specific — this is the sentence a recipient reads to decide you're not
// spamming them.
export const LIST_REASON: Record<ListSlug, string> = {
  ai: "you expressed interest in AI training and workflows",
  unreal: "you expressed interest in Unreal Engine training",
  forage: "you joined the waitlist for Forage",
  "unrealitykit-bridge": "you asked to be notified about UnRealityKit Bridge",
  pinchwork: "you joined the early-access list for Pinchwork",
  "unreal-visionos": "you signed up for Unreal × visionOS updates",
  lab: "you asked for early access to Lab projects",
  skills: "you inquired about a custom AI skill",
  store: "you inquired about something in the store",
  newsletter: "you expressed interest in Unreal Engine and related training opportunities",
  members: "you joined the founding waitlist for membership",
  "team-training": "you inquired about team or studio training",
  "legacy-interest": "you filled out an earlier interest form about learning Unreal Engine",
};

export type ListSlug = keyof typeof LISTS;

export function isListSlug(v: unknown): v is ListSlug {
  return typeof v === "string" && v in LISTS;
}

// Lists that also mirror into a dedicated Resend audience (so Alex can keep
// comparing AI vs Unreal training demand directly in the Resend dashboard).
// Everything else lives only in the Neon DB.
export const RESEND_AUDIENCE_BY_LIST: Partial<Record<ListSlug, string | undefined>> = {
  ai: process.env.RESEND_AI_AUDIENCE_ID,
  unreal: process.env.RESEND_UNREAL_AUDIENCE_ID,
};
