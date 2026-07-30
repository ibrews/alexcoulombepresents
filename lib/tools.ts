// ── Members' Lab tools library — data ───────────────────────────────────────
// Each tool is a real, member-only delivery. Access details live with the
// entry because provisioning may differ by tool; the library page
// (/members/tools) is gated on the `membership` entitlement, so those details
// only ever render for signed-in, active members.

export type LabTool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  accessNote: string;
  status: "shipping" | "coming-soon";
};

export const labTools: LabTool[] = [
  {
    slug: "xrsim",
    name: "xrsim",
    tagline: "Test any OpenXR Android APK locally — no headset required.",
    description:
      "xrsim is a local, GPU-accelerated PICO Emulator harness for running OpenXR Android APKs on a Mac without a headset. It has been verified end-to-end against a real shipped Godot VR game. This is working internal tooling today, not a concept or a preview.",
    accessNote:
      "Private repo — email info@alexcoulombepresents.com with your GitHub username after joining and you'll be added as a collaborator within a day.",
    status: "shipping",
  },
  // {
  //   slug: "future-tool",
  //   name: "Future tool",
  //   tagline: "A concise explanation of what it makes possible.",
  //   description: "What it does, where it runs, and its current state of readiness.",
  //   accessNote: "How active members receive access.",
  //   status: "coming-soon",
  // },
];
