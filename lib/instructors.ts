// ── Instructors — who teaches each class ─────────────────────────────────────
//
// Feeds the per-class pages (/classes/[slug]) and the training calendar
// cards. Guest instructors share their own class page on their networks, so
// the bio here is what their audience reads first: keep it factual, short,
// and approved by the instructor before a class page goes live.
//
// Deliberately NO email addresses here — this repo is public. Instructor
// comps (lifetime Insider membership, see /api/admin/comp-membership) take
// the email at call time and keep it in the database only.
//
// `bioApproved: false` marks a draft bio that hasn't been signed off by the
// instructor yet. The page still renders it; the flag exists so a pre-launch
// review can list exactly which bios still need a yes.

export type Instructor = {
  id: string;
  name: string;
  role: string; // one short credential line under the name
  bio: string;
  photo?: string; // path under /public
  links?: { label: string; url: string }[];
  bioApproved: boolean;
};

export const instructors = [
  {
    id: "alex-coulombe",
    name: "Alex Coulombe",
    role: "Epic Games Authorized Instructor",
    bio:
      "Runs Manhattan's first Unreal Authorized Training Center and has spent ten years shipping real-time XR for architecture, live theater, and brands — now mostly on Apple Vision Pro, Quest, and AI-driven pipelines.",
    photo: "/alex-cutout.webp",
    links: [
      { label: "YouTube", url: "https://www.youtube.com/@ibrews" },
      { label: "Website", url: "https://alexcoulombepresents.com" },
    ],
    bioApproved: true,
  },
  {
    id: "whitt-sellers",
    name: "Whitt Sellers",
    role: "Unreal VR developer",
    bio:
      "Builds standalone Quest experiences in Unreal and knows the rendering trade-offs that make or break them — forward vs. deferred, baked lighting, packaging. Co-authored a Unity to Unreal course with Alex and gave Epic's talk on making that switch.",
    links: [
      {
        label: "Mind the Gap (Epic talk)",
        url: "https://dev.epicgames.com/community/learning/talks-and-demos/0yX9/unreal-engine-mind-the-gap-transitioning-from-unity-to-unreal",
      },
    ],
    bioApproved: false,
  },
  {
    id: "yu-jun-yeh",
    name: "Yu-Jun Yeh",
    role: "Lead developer · senior creative technologist",
    bio:
      "Lead developer on Alex's studio team since 2021: colocated Meta Quest experiences, mixed reality capture, motion capture pipelines, and multiplayer Unreal for live events.",
    bioApproved: false,
  },
  {
    id: "marshall-nowak",
    name: "Marshall Nowak",
    role: "Hardware specialist · VR developer",
    bio:
      "The person to ask about getting VR signal from A to B — cables, splitters, and AV for live events — plus MetaHuman workflows, Perforce and Horde build automation, and Godot on Apple Vision Pro.",
    bioApproved: false,
  },
  {
    id: "dante-cameron",
    name: "Dante Cameron",
    role: "Creative technologist",
    bio:
      "Works across Unreal, Blender, and the physical world: modeling and rigging, materials and shader math, motion design, stereo 360 video, and 3D-printed fabrication.",
    bioApproved: false,
  },
  {
    // Spelled with one "l" on every source (VPD course page, CG Pro). Facts
    // below are from virtualproductiondojo.com/metahuman-production and
    // becomecgpro.com/instructors, read 2026-10-06.
    id: "franco-vilanova",
    name: "Franco Vilanova",
    role: "Gold Unreal Engine Authorized Instructor",
    bio:
      "Senior CG artist specializing in MetaHumans, animation, cinematic production, and real-time character workflows. Leads Unreal animation and MetaHuman production teaching at Virtual Production Dojo and teaches Unreal filmmaking at CG Pro.",
    links: [
      { label: "MetaHuman Production & Performance course", url: "https://virtualproductiondojo.com/metahuman-production/" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/franco-vilanova-65058978/" },
    ],
    bioApproved: false,
  },
  {
    // Credits from the Vertex School podcast page (2022) and his public
    // LinkedIn headline (Unreal Authorized Instructor). Current employer is
    // deliberately left out until Sean confirms how he wants it billed.
    id: "sean-spitzer",
    name: "Sean Spitzer",
    role: "Unreal Authorized Instructor",
    bio:
      "Real-time artist and longtime Unreal educator — an Epic Games Unreal Enterprise senior instructor and master mentor — with credits spanning Enter the Matrix, Frozen's MYTH VR, and Love, Death & Robots. Has also taught at Academy of Art University.",
    links: [{ label: "LinkedIn", url: "https://www.linkedin.com/in/seanspitzer3d" }],
    bioApproved: false,
  },
] as const satisfies readonly Instructor[];

export type InstructorId = (typeof instructors)[number]["id"];

export function instructorById(id: InstructorId): Instructor {
  return instructors.find((i) => i.id === id)!;
}

/** "Alex Coulombe", "Alex Coulombe & Yu-Jun Yeh", "A, B & C". */
export function instructorNames(ids: readonly InstructorId[]): string {
  const names = ids.map((id) => instructorById(id).name);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}
