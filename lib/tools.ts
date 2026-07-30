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
  {
    slug: "forage",
    name: "Forage",
    tagline: "An AI-first scout and installer for the Unreal Engine asset packs you already own.",
    description:
      "Forage matches a creative intent like \"amazing castle with horses running around the gates\" against your entire owned Fab/Marketplace library, tells you which packs and hero assets fit, and installs them — driven from the CLI, a local web UI, or an MCP server any AI build agent can query directly. Currently in private beta.",
    accessNote:
      "Private repo — email info@alexcoulombepresents.com with your GitHub username after joining and you'll be added as a collaborator within a day.",
    status: "shipping",
  },
  {
    slug: "constellation",
    name: "Constellation",
    tagline: "Your second brain as a navigable 3D star map on Apple Vision Pro.",
    description:
      "Constellation turns any folder of markdown notes — an Obsidian vault, a personal wiki, your own second brain — into a live, walk-in 3D graph: notes are stars, wiki-links are beams of light between them, and you can pinch-drag any star to reshape the layout in real time. Ships with a sanitized, structural-only demo graph today, so you can try it immediately without exposing your own notes.",
    accessNote:
      "Private repo — email info@alexcoulombepresents.com with your GitHub username after joining and you'll be added as a collaborator within a day.",
    status: "shipping",
  },
  {
    slug: "promptbook",
    name: "Promptbook",
    tagline: "Spatial blocking and set previz for theatre on Apple Vision Pro.",
    description:
      "Design blocking on a tabletop miniature stage, scrub a beat timeline to watch the cast move, then promote the same scene to full scale and check any sightline in the house. Script reader, walk recording, and USDZ set import round it out — a digital promptbook that actually interleaves blocking with the script.",
    accessNote:
      "Private repo — email info@alexcoulombepresents.com with your GitHub username after joining and you'll be added as a collaborator within a day.",
    status: "shipping",
  },
  {
    slug: "pinchwork",
    name: "Pinchwork",
    tagline: "Universal OpenXR hand tracking, built for every headset — not just one.",
    description:
      "A template that treats hands as first-class input across the whole OpenXR ecosystem: pinch-to-grab with real physics, rotate-with-hand, gesture-driven level travel, all codified into Unreal's Enhanced Input system. Still in active development — not yet ready to hand to members for hands-on use.",
    accessNote: "Not open yet — check back as this one moves toward a stable release.",
    status: "coming-soon",
  },
];
