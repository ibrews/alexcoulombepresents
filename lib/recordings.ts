// ── Members' recording library — data ───────────────────────────────────────
// Interim delivery per business plan §2.6: a gated list of links to wherever
// each recording is hosted (unlisted video, R2 object, etc.). The HLS-on-R2
// player replaces `url` links later — this shape is forward-compatible with
// that (slug becomes the player route param).
//
// To publish a recording: append an entry here. The library page
// (/members/recordings) is gated on the `membership` entitlement, so links
// only ever render for signed-in, active members.

export type Recording = {
  slug: string;
  title: string;
  recordedAt: string; // ISO date, e.g. "2026-08-14" — sorts the library
  // Display override for entries whose exact day isn't recorded anywhere
  // (older sessions where only the month, or just the event, is known).
  // Without this the page would print a precise date we can't stand behind.
  dateLabel?: string;
  description: string;
  url: string; // interim: direct link to the hosted recording
  youtubeId?: string; // when hosted on YouTube — drives the thumbnail
  durationMin?: number;
  topics?: string[];
  // Slide decks and handouts. Members-only files go through materialHref(key)
  // — the key must exist in lib/materials.ts, which tests/recordings.test.ts
  // enforces. Public links from the original class (Dropbox, Drive) can be
  // plain URLs.
  materials?: { label: string; href: string }[];
};

const yt = (id: string) => `https://youtu.be/${id}`;

// Inlined rather than imported from lib/materials.ts on purpose: that module
// pulls in node:path, and this one is imported by the test runner without the
// "@/" alias. The shape is asserted against the registry in the tests.
const materialHref = (key: string) => `/api/members/material?key=${encodeURIComponent(key)}`;

export const recordings: Recording[] = [
  {
    slug: "intro-to-vr-2026-08-12",
    title: "Intro to VR",
    recordedAt: "2026-08-12",
    description:
      "The VR class: how virtual reality actually works, what the headset landscape looks like right now, and getting an Unreal project running on a headset. Slide deck below.",
    url: yt("0WPJjRclWLQ"),
    youtubeId: "0WPJjRclWLQ",
    topics: ["unreal", "vr", "intro"],
    materials: [
      { label: "Slide deck (PDF)", href: materialHref("intro-to-vr-2026-08-12-slides") },
    ],
  },
  {
    slug: "live-unreal-training-2026-08-05",
    title: "Live Unreal Training — the first class",
    recordedAt: "2026-08-05",
    description:
      "Kickoff of the Wednesday series: what the curriculum covers and the AI philosophy behind it, MCP explained, a tour of Unreal's sample projects and starter templates, plus guest tutorials from Yu-Jun Yeh (Begin Play order and multiplayer pawn timing) and Saurabh Saxena (exporting Unreal levels to the web with Three.js). Ends on live LiveLink Hub webcam face tracking and auto-building a MetaHuman.",
    url: yt("FW6xfFzF0_o"),
    youtubeId: "FW6xfFzF0_o",
    durationMin: 122,
    topics: ["unreal", "ai", "mcp", "metahuman"],
    materials: [
      {
        label: "Presentation",
        href: "https://ibrews.github.io/sensai-2026-mcp-engines/first-ue5-class.html",
      },
    ],
  },

  // ── Archive: earlier free live training, workshops, and conference talks ──
  {
    slug: "ai-mcp-blender-unreal-godot-2026-06",
    title: "How to Use AI & MCP for Blender, Unreal & Godot",
    recordedAt: "2026-06-30",
    description:
      "Two modes of AI in a 3D pipeline — interactive automation, where agents edit a live scene, and headless pipelines, where they process assets without the editor open — worked through Blender, Unreal, and Godot.",
    url: yt("JR5397NUz3I"),
    youtubeId: "JR5397NUz3I",
    durationMin: 122,
    topics: ["ai", "mcp", "blender", "unreal", "godot"],
    materials: [
      { label: "Slide deck", href: "https://ibrews.github.io/sensai-2026-mcp-engines/?present" },
    ],
  },
  {
    slug: "package-unreal-xr-apps",
    title: "Package Unreal XR Apps",
    recordedAt: "2025-12-02",
    dateLabel: "2025",
    description:
      "Preparing and submitting an Unreal XR build: build configuration, packaging, and the pitfalls that eat an afternoon if you hit them cold.",
    url: yt("m63LEa1z_Zs"),
    youtubeId: "m63LEa1z_Zs",
    durationMin: 22,
    topics: ["unreal", "xr", "packaging"],
  },
  {
    slug: "port-xr-apps-vision-pro-quest-android-xr",
    title: "Port Your XR Apps Across Vision Pro, Quest, and Android XR",
    recordedAt: "2025-11-29",
    dateLabel: "2025",
    description:
      "Cross-platform XR in practice: where Apple Vision Pro, Meta Quest, Samsung Galaxy XR, and Android XR actually differ, and the porting workflows that survive all four.",
    url: yt("QbMljBEGiRw"),
    youtubeId: "QbMljBEGiRw",
    durationMin: 103,
    topics: ["xr", "vision pro", "quest", "android xr"],
  },
  {
    slug: "unreal-workshop-2025-day-2",
    title: "Unreal Engine Workshop — Day 2",
    recordedAt: "2025-11-16",
    description:
      "2D vs 3D and where these tools land in a theatre production, then Blueprint interactivity and cues, virtual camera, and Movie Render Queue. Co-presented with re:Naissance Opera and DigiBC.",
    url: yt("18fYyssIS-E"),
    youtubeId: "18fYyssIS-E",
    durationMin: 405,
    topics: ["unreal", "blueprints", "virtual production", "workshop"],
  },
  {
    slug: "unreal-workshop-2025-day-1",
    title: "Unreal Engine Workshop — Day 1",
    recordedAt: "2025-11-15",
    description:
      "A full day from zero: intro to Unreal and kitbashing, building a MetaHuman, and intro to lighting. Co-presented with re:Naissance Opera and DigiBC. (Heads up — the good audio drops out around the four-hour mark.)",
    url: yt("FyBkTJ2PQT0"),
    youtubeId: "FyBkTJ2PQT0",
    durationMin: 382,
    topics: ["unreal", "metahuman", "lighting", "workshop"],
  },
  {
    slug: "collab-viewer-unreal-fest-orlando-2025",
    title: "The Best Template You're Not Using: Maximizing the Collab Viewer",
    recordedAt: "2025-10-10",
    dateLabel: "Unreal Fest Orlando 2025",
    description:
      "The fastest route to a multiplayer experience that runs on desktop and in VR — the Collaborative Viewer Template, and how far you can customize it past the defaults.",
    url: yt("Gy6_v9jr-5w"),
    youtubeId: "Gy6_v9jr-5w",
    durationMin: 40,
    topics: ["unreal", "multiplayer", "vr", "collab viewer"],
  },
  {
    slug: "intro-to-virtual-reality-2024-06-03",
    title: "Intro to Virtual Reality — live training",
    recordedAt: "2024-06-03",
    description:
      "The earlier free VR session: how VR works, what the hardware asks of your project, and getting something running on a headset.",
    url: yt("-SjB2Nfkobw"),
    youtubeId: "-SjB2Nfkobw",
    durationMin: 136,
    topics: ["unreal", "vr", "intro"],
    materials: [
      {
        label: "Slide deck",
        href: "https://drive.google.com/file/d/1KMjkLO0LO671bgwkeGxf4uclbuPthOn3/view",
      },
    ],
  },
  {
    slug: "intro-to-ue5-3-josi-morgan-2023-11",
    title: "Intro to UE5.3 — with Josi Morgan",
    recordedAt: "2023-11-06",
    dateLabel: "November 2023",
    description: "Josi Morgan takes the Intro to Unreal Engine 5.3 session, start to finish.",
    url: yt("jNQ9aPI1fU8"),
    youtubeId: "jNQ9aPI1fU8",
    durationMin: 108,
    topics: ["unreal", "intro"],
    materials: [
      {
        label: "Course content (Dropbox)",
        href: "https://www.dropbox.com/scl/fo/3lds0nqdp6qib2dpurb0v/h?rlkey=tq1k8vh7gq8m58w5ie6t1n94b&dl=0",
      },
    ],
  },
  {
    slug: "intro-to-ue5-3-2023-10",
    title: "Intro to Unreal Engine 5.3",
    recordedAt: "2023-10-09",
    dateLabel: "October 2023",
    description:
      "The original free intro session — the editor, a first project, and the vocabulary everything later builds on.",
    url: yt("9lzZW6JDWGk"),
    youtubeId: "9lzZW6JDWGk",
    durationMin: 122,
    topics: ["unreal", "intro"],
    materials: [
      {
        label: "Course content (Dropbox)",
        href: "https://www.dropbox.com/sh/ggf7ax7hay333fs/AACmG7NdjjCUyXV69xM2enqwa?dl=0",
      },
    ],
  },
];
