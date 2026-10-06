// ── Class sessions — one public page per class, office hours, or livestream ──
//
// Every session gets its own shareable page at /classes/[slug], past ones
// included, so a guest instructor can post THEIR class instead of the whole
// /training page. This file is the editorial layer: who teaches, the long
// description, what you'll learn. Price, purchasability, and the exact
// session time for paid classes still come from lib/store.ts (storeSlug) —
// tests/class-sessions.test.ts fails if the two ever disagree on the date.
//
// After a session runs, add its recordingSlug (lib/recordings.ts) and the
// page switches to "What we covered", using the AI summary keyed by the
// recording's YouTube id in lib/classSummaries.ts.

import type { InstructorId } from "./instructors.ts";
import { storeItems } from "./store.ts";

export type SessionKind = "class" | "office-hours" | "livestream";
export type SessionLevel = "Intro" | "Intermediate" | "Expert" | "All levels";

export type ClassSession = {
  slug: string; // URL: /classes/<slug>
  kind: SessionKind;
  title: string;
  startsISO: string;
  durationMin: number;
  instructorIds: InstructorId[];
  // Shown under the instructor line when the teacher isn't locked yet, e.g.
  // a backup plan while Alex travels. Keep it honest and short.
  instructorNote?: string;
  level: SessionLevel;
  blurb: string; // one or two sentences for cards and meta descriptions
  description: string; // the page's lead paragraph
  learn?: string[]; // "What you'll learn" — upcoming sessions
  storeSlug?: string; // lib/store.ts item that sells this seat
  materialsSlug?: string; // lib/classMaterials.ts folder
  recordingSlug?: string; // lib/recordings.ts entry, once it exists
  watchUrl?: string; // free public sessions (livestreams)
  youtubeId?: string; // free public video to embed on the page (livestreams only)
  related?: { label: string; url: string }[];
};

// Wednesdays deliberately left empty. The calendar renders these as a
// "no class" card instead of a "TBD via voting" placeholder.
export const calendarBreaks: { dateISO: string; title: string; note: string }[] = [
  {
    dateISO: "2026-11-25",
    title: "No class — Thanksgiving week",
    note: "The rest of the year gets announced right after the holiday.",
  },
];

const ALEX: InstructorId = "alex-coulombe";

export const classSessions: ClassSession[] = [
  // ── Aug–Sep 2026: the first run ─────────────────────────────────────────
  {
    slug: "2026-08-05-live-unreal-training-first-class",
    kind: "class",
    title: "Live Unreal Training — the first class",
    startsISO: "2026-08-05T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX, "yu-jun-yeh"],
    level: "All levels",
    blurb: "The free kickoff: the curriculum, the AI philosophy behind it, and a live MetaHuman build from a webcam.",
    description:
      "The free session that started the Wednesday series — what the curriculum covers and why AI runs through all of it, plus guest tutorials and a live MetaHuman build to close.",
    recordingSlug: "live-unreal-training-2026-08-05",
  },
  {
    slug: "2026-08-12-intro-to-vr",
    kind: "class",
    title: "Intro to VR in Unreal 5.8",
    startsISO: "2026-08-12T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intro",
    blurb: "How VR actually works, the headset landscape, and getting an Unreal project running on a headset.",
    description:
      "The VR on-ramp: how virtual reality works, what the headset landscape looks like right now, and getting an Unreal 5.8 project running on a headset — with or without one on your desk.",
    storeSlug: "wed-2026-08-12-intro-vr",
    materialsSlug: "wed-2026-08-12-intro-vr",
    recordingSlug: "intro-to-vr-2026-08-12",
  },
  {
    slug: "2026-08-19-intermediate-xr",
    kind: "class",
    title: "Intermediate XR in Unreal 5.8",
    startsISO: "2026-08-19T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intermediate",
    blurb: "Past the basics: lighting choices, passthrough, locomotion, and the performance work that keeps XR comfortable.",
    description:
      "Past the template: standalone versus PCVR rendering, baked lighting versus Lumen, passthrough, locomotion, and the optimization habits that keep an XR build comfortable.",
    storeSlug: "wed-2026-08-19-intermediate-vr",
    materialsSlug: "wed-2026-08-19-intermediate-vr",
    recordingSlug: "intermediate-xr-2026-08-19",
  },
  {
    slug: "2026-08-26-intro-to-metahumans",
    kind: "class",
    title: "Intro to MetaHumans in Unreal 5.8",
    startsISO: "2026-08-26T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intro",
    blurb: "Building MetaHumans inside the editor and from your own meshes — realistic and stylized, animated live.",
    description:
      "MetaHumans the new way, from inside the editor: sculpting and customizing, assembling cinematic versus optimized versions, live facial animation from a webcam, and turning your own scans into MetaHumans.",
    storeSlug: "wed-2026-08-26-intro-metahumans",
    materialsSlug: "wed-2026-08-26-intro-metahumans",
    recordingSlug: "intro-to-metahumans-2026-08-26",
  },
  {
    slug: "2026-08-28-office-hours-cloth-physics",
    kind: "office-hours",
    title: "Office Hours — Cloth Physics",
    startsISO: "2026-08-28T17:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "All levels",
    blurb: "Friday office hours on real-time cloth: painting cloth data, wind, softer motion, and caching the result.",
    description:
      "A Friday office hours that turned into a cloth session: from a static mesh to billowing real-time fabric, then recording the simulation so it plays back for free.",
    storeSlug: "office-hours-dropin",
    recordingSlug: "office-hours-cloth-physics-2026-08-28",
  },
  {
    slug: "2026-09-02-intro-to-mocap",
    kind: "class",
    title: "Intro to Mocap in Unreal 5.8",
    startsISO: "2026-09-02T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intermediate",
    blurb: "Face and body capture onto a MetaHuman or custom rig — markerless video, phone depth capture, and cleanup.",
    description:
      "Face and body motion capture into Unreal 5.8 without a mocap stage: markerless video, phone depth capture, a virtual camera, and getting the result onto any character.",
    storeSlug: "wed-2026-09-02-mocap",
    materialsSlug: "wed-2026-09-02-mocap",
    recordingSlug: "intro-to-mocap-2026-09-02",
  },
  {
    slug: "2026-09-04-office-hours-cables",
    kind: "office-hours",
    title: "Office Hours — Cables",
    startsISO: "2026-09-04T17:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "All levels",
    blurb: "Friday office hours: swingable cables and vines in VR, built and tested live in a headset.",
    description:
      "A Friday office hours spent building something fun: cables and vines you can grab and swing on in VR, prototyped in Blueprints and tuned live in a headset for comfort.",
    storeSlug: "office-hours-dropin",
    recordingSlug: "office-hours-cables-2026-09-04",
  },
  {
    slug: "2026-09-09-intro-to-pcg-and-ai",
    kind: "class",
    title: "Intro to PCG & AI",
    startsISO: "2026-09-09T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intro",
    blurb: "Scatter believable environments with PCG — then let an AI agent build the graph for you over MCP.",
    description:
      "Procedural Content Generation from scratch, plus the part nobody else teaches yet: wiring Unreal to an AI agent over MCP and letting it author PCG graphs for you.",
    storeSlug: "wed-2026-09-09-intro-pcg",
    materialsSlug: "wed-2026-09-09-intro-pcg",
    recordingSlug: "intro-to-pcg-ai-2026-09-09",
  },
  {
    slug: "2026-09-16-unity-to-unreal",
    kind: "class",
    title: "Unity to Unreal",
    startsISO: "2026-09-16T15:00:00Z",
    durationMin: 120,
    instructorIds: ["whitt-sellers"],
    level: "Intro",
    blurb: "Making the switch: the concepts that map over, the ones that don't, and why your Prefabs are now Blueprints.",
    description:
      "For anyone coming from Unity: the terms, panels, and habits that translate, the ones that don't, and a hands-on path from Blueprints and materials to animation state machines.",
    storeSlug: "wed-2026-09-16-unity-to-unreal",
    materialsSlug: "wed-2026-09-16-unity-to-unreal",
    recordingSlug: "unity-to-unreal-2026-09-16",
  },
  {
    slug: "2026-09-18-office-hours-hand-tracking",
    kind: "office-hours",
    title: "Office Hours — Hand Tracking",
    startsISO: "2026-09-18T17:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "All levels",
    blurb: "Friday office hours on controller-free hand tracking: getting OpenXR hands working, then gestures that move you.",
    description:
      "A Friday office hours on hand tracking: untangling OpenXR hands across PCVR streaming setups, then building pinch and open-palm gestures that drive locomotion.",
    storeSlug: "office-hours-dropin",
    recordingSlug: "office-hours-hand-tracking-2026-09-18",
  },
  {
    // Store slug says "09-30" — the class swapped dates with USD/GLB on
    // 2026-09-15 (lib/store.ts has why). The page slug uses the real date.
    slug: "2026-09-23-intro-to-ar",
    kind: "class",
    title: "Intro to AR in Unreal 5.8",
    startsISO: "2026-09-23T15:00:00Z",
    durationMin: 120,
    instructorIds: ["yu-jun-yeh"],
    level: "Intro",
    blurb: "Handheld AR for Android and iOS from one Unreal project: plane detection, image tracking, and getting it on a device.",
    description:
      "Augmented reality on phones and tablets from one Unreal project — setup that actually works, plane detection, image tracking, and deploying to a real device.",
    storeSlug: "wed-2026-09-30-intro-ar",
    materialsSlug: "wed-2026-09-30-intro-ar",
    recordingSlug: "intro-to-ar-2026-09-23",
  },
  {
    // Same date-swap note as Intro to AR: store slug "09-23", real date 9/30.
    slug: "2026-09-30-ue5-to-openusd-to-glb",
    kind: "class",
    title: "Exporting UE5 to OpenUSD to GLB",
    startsISO: "2026-09-30T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intermediate",
    blurb: "A real cross-platform export pipeline: Unreal scenes out through OpenUSD and GLB, then checked in Godot and Three.js.",
    description:
      "Getting Unreal scenes out without losing what matters: OpenUSD and GLB export, what survives and what doesn't, and the same scene checked in Godot and Three.js.",
    storeSlug: "wed-2026-09-23-usd-glb-export",
    materialsSlug: "wed-2026-09-23-usd-glb-export",
  },

  // ── Oct–Nov 2026 ────────────────────────────────────────────────────────
  {
    slug: "2026-10-07-membership-tour-livestream",
    kind: "livestream",
    title: "Live AMA: Meta's VR Glasses, the Member Toolkit, and What's Next",
    startsISO: "2026-10-07T13:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "All levels",
    blurb:
      "A free livestream: ask me anything (yes, including trying Meta's VR glasses at Connect), a tour of every tool and plugin members get, and the classes coming up.",
    description:
      "No class this week. Instead, a free livestream that's part AMA, part show-and-tell. Ask me anything — including what it was like trying Meta's VR glasses at Meta Connect. Then a tour of every tool and plugin that comes with membership and how to actually use each one, some of what I'm building right now, and a first look at the classes coming up through November. Members: treat the tour as your tutorial. Everyone else: it's the clearest look at what you'd get.",
    learn: [
      "What trying Meta's VR glasses at Connect was actually like — bring your questions",
      "A tour of every member tool and plugin, and how to use each one",
      "What I'm building right now, shown live",
      "The classes coming up through November, and who's teaching them",
    ],
    watchUrl: "https://www.youtube.com/watch?v=uYAjHLA3htU",
    youtubeId: "uYAjHLA3htU",
  },
  {
    slug: "2026-10-14-metahuman-clothing-physics",
    kind: "class",
    title: "MetaHuman Clothing Physics in UE 5.8",
    startsISO: "2026-10-14T15:00:00Z",
    durationMin: 120,
    instructorIds: ["franco-vilanova"],
    level: "Intermediate",
    blurb:
      "Guest instructor Franco Vilanova on MetaHuman wardrobe that moves like real fabric — cloth setup, simulation, and the settings that sell it.",
    description:
      "Gold Unreal Authorized Instructor Franco Vilanova on dressing MetaHumans in Unreal 5.8 so their clothes move like real fabric. You'll see how MetaHuman wardrobe and cloth are set up, how the simulation is driven, and which settings make the difference between stiff and believable. It's a two-hour preview of Franco's five-week MetaHuman Production & Performance course, so you'll also see where clothing fits in a production-grade MetaHuman pipeline.",
    learn: [
      "How MetaHuman wardrobe and clothing assets are structured in Unreal 5.8",
      "Setting up cloth so garments simulate instead of sitting rigid",
      "The physics and simulation settings that make fabric read as real",
      "Where clothing fits in a production MetaHuman workflow",
    ],
    storeSlug: "wed-2026-10-14-metahuman-clothing-physics",
    materialsSlug: "wed-2026-10-14-metahuman-clothing-physics",
    related: [
      {
        label: "Franco's MetaHuman Production & Performance course (Virtual Production Dojo)",
        url: "https://virtualproductiondojo.com/metahuman-production/",
      },
    ],
  },
  {
    slug: "2026-10-21-lumen-deep-dive",
    kind: "class",
    title: "Deep Dive with Lumen for UE 5.8",
    startsISO: "2026-10-21T15:00:00Z",
    durationMin: 120,
    instructorIds: ["sean-spitzer"],
    level: "Intermediate",
    blurb:
      "Guest instructor Sean Spitzer on Lumen in 5.8 and the new Lumen Lite — when to use it, mobile and standalone, and side-by-side comparisons.",
    description:
      "Sean Spitzer, who spent seven years teaching Unreal to studios like Pixar, DreamWorks, and Blizzard as a senior instructor at Epic Games, goes deep on Lumen in Unreal 5.8, with special attention to the new Lumen Lite — a faster, medium-quality global illumination mode, in Beta in 5.8. When should you reach for it instead of full Lumen? How does it hold up on mobile and standalone hardware? And what does it actually look like side by side?",
    learn: [
      "How Lumen lights your scene in 5.8, and where the cost goes",
      "What Lumen Lite is and when to choose it over full Lumen",
      "Lumen Lite on mobile and standalone devices: what works",
      "Side-by-side comparisons, and the settings that matter most",
    ],
    storeSlug: "wed-2026-10-21-lumen-deep-dive",
    materialsSlug: "wed-2026-10-21-lumen-deep-dive",
  },
  {
    slug: "2026-10-28-vr-cinematics",
    kind: "class",
    title: "VR Cinematics for UE 5.8",
    startsISO: "2026-10-28T15:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intermediate",
    blurb:
      "Record someone playing your VR game, re-shoot it from new angles, smooth the camera, and render a trailer-ready cinematic.",
    description:
      "Turn real VR gameplay into a cinematic. Record a session with Take Recorder and Replay, test it without a headset in Meta XR Simulator, re-shoot it from new camera angles, smooth out head motion in Sequencer or with Meta Quest Developer Hub, and render it with Movie Render Queue or Movie Render Graph.",
    learn: [
      "Capturing VR gameplay with Take Recorder and Replay",
      "Testing and recording without a headset in Meta XR Simulator",
      "Re-shooting a take from new angles and damping the camera",
      "Rendering with Movie Render Queue and Movie Render Graph",
    ],
    storeSlug: "wed-2026-10-28-vr-cinematics",
    materialsSlug: "wed-2026-10-28-vr-cinematics",
  },
  {
    // DST ended Nov 1: 11a ET is 16:00Z from here on.
    slug: "2026-11-04-creative-ai-masterclass-part-1",
    kind: "class",
    title: "Creative AI Workflow Masterclass, Part 1: Set Up From Scratch",
    startsISO: "2026-11-04T16:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intro",
    blurb:
      "Not just for Unreal. Go from nothing to a working creative AI setup — agents, tool connections, and a memory that keeps them useful.",
    description:
      "Part 1 of 2, and not just for Unreal. Start from zero and leave with a working creative AI setup: an agent you trust, connected to the tools you already use, with a memory that carries what it learns from one session to the next.",
    learn: [
      "Choosing and installing an AI agent setup from scratch",
      "Connecting it to your creative tools — Unreal, Blender, Godot, and more over MCP",
      "Giving it a memory: a knowledge base it reads and writes",
      "The habits that keep it useful instead of chaotic",
    ],
    storeSlug: "wed-2026-11-04-creative-ai-masterclass-1",
    materialsSlug: "wed-2026-11-04-creative-ai-masterclass-1",
  },
  {
    slug: "2026-11-11-creative-ai-masterclass-part-2",
    kind: "class",
    title: "Creative AI Workflow Masterclass, Part 2: Let It Run",
    startsISO: "2026-11-11T16:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intermediate",
    blurb:
      "Get AI to package builds, run overnight, and make apps and videos without you holding its hand.",
    description:
      "Part 2 of 2. Once you're set up, the real payoff: handing an agent long jobs and walking away. Packaging builds, running overnight, making apps and videos — and setting it up so you wake up to finished, checked work instead of a mess.",
    learn: [
      "Handing off long jobs: builds, packaging, and overnight runs",
      "Making apps and videos with agents end to end",
      "Verification that catches mistakes before you see them",
      "Guardrails and budgets so it never runs away from you",
    ],
    storeSlug: "wed-2026-11-11-creative-ai-masterclass-2",
    materialsSlug: "wed-2026-11-11-creative-ai-masterclass-2",
  },
  {
    slug: "2026-11-18-gaussian-splatting-vr",
    kind: "class",
    title: "Gaussian Splatting for VR in UE 5.8",
    startsISO: "2026-11-18T16:00:00Z",
    durationMin: 120,
    instructorIds: [ALEX],
    level: "Intermediate",
    blurb:
      "Capture synthetic splats inside Unreal, train them, and get them rendering smoothly — in the editor and in VR, standalone and PCVR.",
    description:
      "Gaussian splats, start to finish, for VR. Capture synthetic splats from inside Unreal, train them, and then do the hard part: getting them to render smoothly not just in the editor, but in a headset — both standalone and PCVR.",
    learn: [
      "Capturing synthetic splat data from an Unreal scene",
      "Training the splat",
      "Bringing it back into Unreal 5.8",
      "Getting smooth frame rates in VR on standalone and PCVR",
    ],
    storeSlug: "wed-2026-11-18-gaussian-splatting-vr",
    materialsSlug: "wed-2026-11-18-gaussian-splatting-vr",
  },
];

export function sessionBySlug(slug: string): ClassSession | undefined {
  return classSessions.find((s) => s.slug === slug);
}

/** The page for a store item, e.g. to link a calendar card to its class page. */
export function sessionForStoreSlug(storeSlug: string): ClassSession | undefined {
  return classSessions.find((s) => s.storeSlug === storeSlug && s.kind === "class");
}

export function sessionEndsISO(s: ClassSession): string {
  return new Date(Date.parse(s.startsISO) + s.durationMin * 60_000).toISOString();
}

export function isPast(s: ClassSession, now: number = Date.now()): boolean {
  return Date.parse(sessionEndsISO(s)) <= now;
}

/** Unlisted = its store item is unlisted: reachable by link, kept out of listings. */
export function isUnlisted(s: ClassSession): boolean {
  return Boolean(s.storeSlug && storeItems.find((i) => i.slug === s.storeSlug)?.unlisted);
}

type ListOpts = { includeUnlisted?: boolean };

export function upcomingSessions(now: number = Date.now(), opts: ListOpts = {}): ClassSession[] {
  return classSessions
    .filter((s) => !isPast(s, now) && (opts.includeUnlisted || !isUnlisted(s)))
    .sort((a, b) => a.startsISO.localeCompare(b.startsISO));
}

export function pastSessions(now: number = Date.now(), opts: ListOpts = {}): ClassSession[] {
  return classSessions
    .filter((s) => isPast(s, now) && (opts.includeUnlisted || !isUnlisted(s)))
    .sort((a, b) => b.startsISO.localeCompare(a.startsISO));
}
