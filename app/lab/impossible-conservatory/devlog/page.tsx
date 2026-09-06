import type { Metadata } from "next";
import Link from "next/link";
import SpatialLabDevlog, { type DevlogEntry } from "@/components/SpatialLabDevlog";

export const metadata: Metadata = {
  title: "Impossible Conservatory — Development Log",
  description: "The proposed Impossible Conservatory interaction model, its PICO capability basis, and the integration tests still required.",
  alternates: { canonical: "/lab/impossible-conservatory/devlog" },
};

const entries: DevlogEntry[] = [
  {
    date: "September 6, 2026",
    title: "The habitat starts small enough to meet",
    status: "planned",
    body:
      "The opening scene is an AI-designed living habitat at tabletop scale, embedded in the real room through color passthrough. One expressive creature gives the scene a social center. The world can later grow to room scale, but expansion is a deliberate authored transition rather than an automatic reconstruction of everything around it.",
    notes: [
      "Tabletop-first scale establishes comfort and legibility.",
      "Surfaces should respect the room's known geometry and occlusion.",
      "Room-scale expansion requires an explicit user action.",
      "No automatic object cloning or SpatialLM dependency.",
    ],
  },
  {
    date: "Interaction definition",
    title: "Attention should be visible, specific, and reversible",
    status: "planned",
    body:
      "The creature notices sustained gaze, responds to a smile or wink with a visible facial or body expression, and reacts to hand contact. These inputs drive authored interactions; they are not used to infer a person's emotional state. Every response needs a clear neutral return so attention feels alive without becoming a permanent judgment about the viewer.",
    notes: [
      "Gaze: orient, approach, reveal, or become curious.",
      "Smile/wink: trigger a visible authored expression, never an emotion label.",
      "Hand contact: proximity first, then contact response with clear feedback.",
      "Provide non-face alternatives for every required action.",
    ],
  },
  {
    date: "Capability review",
    title: "The SDK has the ingredients; the app has not combined them",
    status: "correction underway",
    body:
      "PICO provides developer surfaces for eye and face tracking, hand input, spatial awareness, and mixed reality, and the target hardware's passthrough is suitable for this visual direction. That establishes feasibility to investigate, not a completed Unreal integration. Access, permissions, signal quality, latency, spatial stability, and sustained performance remain device tests.",
    notes: [
      "Confirm the target device and runtime expose every required signal together.",
      "Map tracking confidence and loss states before authoring creature reactions.",
      "Test passthrough composition across several real lighting conditions.",
      "Measure the combined render and tracking budget in a sustained session.",
    ],
  },
  {
    date: "First prototype",
    title: "Build one honest social loop",
    status: "next test",
    body:
      "The first device build should do one small thing completely: anchor a simple creature on a table, let it acquire and lose gaze cleanly, respond visibly to one wink or smile signal, and acknowledge one hand-contact gesture. Habitat generation and room-scale expansion follow only after that loop feels stable and understandable.",
    notes: [
      "Neutral creature and habitat proxy art",
      "Input-state recorder with no image retention",
      "On-device capture labeled with runtime and build",
      "Short GIF of the interaction loop, then a continuous device video",
    ],
  },
];

export default function ImpossibleConservatoryDevlog() {
  return (
    <>
      <SpatialLabDevlog
        productName="Impossible Conservatory"
        eyebrow="Development log · proposed PICO experience"
        title="A world that notices you."
        intro="This is the concept and validation ledger for Impossible Conservatory. PICO tracking and mixed-reality capabilities make the interaction worth pursuing; the Unreal app, creature behavior, and on-device results remain work to be demonstrated."
        entries={entries}
        nextMedia={[
          "Tabletop scale and occlusion study from the Unreal editor",
          "Signal-state capture for gaze, wink/smile, and hand contact",
          "Short on-device GIF of the first creature response loop",
          "Continuous passthrough video of controlled room-scale expansion",
        ]}
      />
      <p className="mx-auto -mt-14 max-w-5xl px-5 pb-24 text-sm text-mist">
        Capability references: <Link href="https://developer.picoxr.com/resources/" className="text-teal hover:underline">PICO developer resources</Link>.
      </p>
    </>
  );
}
