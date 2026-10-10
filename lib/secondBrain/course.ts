export const KIT_RELEASE_ID = "0.1.0-alpha.1";
export const KIT_FILENAME = "ACP-Second-Brain-Course-Kit-Candidate-0.1.0-alpha.1-2026-10-10.zip";
export const KIT_SHA256 = "463199e8ae302f3c1588c7dac19049d287955e6e7a6a0e0280f88f58e334272a";
export const KIT_OBJECT_KEY = `class-materials/acp-second-brain/${KIT_RELEASE_ID}/${KIT_FILENAME}`;
export const KIT_MEMBER_FOLDER = "acp-second-brain";
export const KIT_CLASS_SLUGS = [
  "wed-2026-11-04-creative-ai-masterclass-1",
  "wed-2026-11-11-creative-ai-masterclass-2",
] as const;
export function secondBrainAccess(access: { member: boolean; purchasedSlugs: string[] }) {
  const downloadClass = access.member ? KIT_MEMBER_FOLDER : KIT_CLASS_SLUGS.find(s => access.purchasedSlugs.includes(s));
  return { allowed: Boolean(downloadClass), member: access.member, downloadClass };
}
