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
} as const;

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
