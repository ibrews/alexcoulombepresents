import type { Metadata } from "next";
import SpatialLabDevlog, { type DevlogEntry } from "@/components/SpatialLabDevlog";

export const metadata: Metadata = {
  title: "Light Pavilion — Development Log",
  description: "The Light Pavilion build in sequence: early render failures, corrections, and the Unreal Lumen and Apple Vision Pro M5 tests still ahead.",
  alternates: { canonical: "/lab/light-pavilion/devlog" },
};

const entries: DevlogEntry[] = [
  {
    date: "September 6, 2026 · frame 01",
    title: "Reversing the sun did not reveal the pavilion",
    status: "failed review",
    body:
      "The first neutral Blender CPU review came back nearly black inside. The receiver disappeared, the foreground furniture blocked the core relationship, and a pale horizon bar cut across the opening. This frame answered one useful question: changing sun direction alone would not make the light path legible.",
    media: [
      {
        kind: "image",
        src: "/lab/light-pavilion/failed-neutral-sun-reversed.png",
        alt: "A very dark rendered room with two tall pavilion panels silhouetted against a bright window and a pale horizontal bar outside.",
        label: "Offline render · failed",
        caption:
          "Blender CPU neutral preview. This is not a headset capture. It failed for crushed interior values, weak subject separation, foreground occlusion, and the distracting exterior horizon bar.",
      },
    ],
  },
  {
    date: "September 6, 2026 · frame 02",
    title: "The corrected blockout clears its first visual gate",
    status: "accepted offline",
    body:
      "A second correction rotated the receiver and color panel, moved and lowered the control stand, raised fixed exposure and world fill, and removed the horizon bar. The resulting neutral frame was accepted as a Phase 1 blockout composition. It establishes the art direction; it is not final art, a Lumen result, or device acceptance.",
    media: [
      {
        kind: "image",
        src: "/lab/light-pavilion/neutral.png",
        alt: "A warm rendered room with a red reflector panel and a larger neutral panel standing in front of a bright window, casting long shadows across the floor.",
        label: "Offline render · WIP",
        caption:
          "Blender CPU neutral preview after the second correction. Accepted for the offline Phase 1 blockout composition; monolithic fin geometry, the cropped dark vessel and plinth, and unimplemented controls remain refinement work.",
      },
    ],
    notes: [
      "Acceptance applies to the offline blockout composition only.",
      "The receiver remains shaded so the panel's reflected color can be compared.",
      "Unreal import, distance fields, collision, and runtime controls remain unverified.",
      "No Apple Vision Pro M5 result is inferred from this CPU preview.",
    ],
  },
  {
    date: "September 6, 2026 · comparison 01",
    title: "The first matched bounce comparison reads",
    status: "accepted offline",
    body:
      "With camera, sun, and exposure held fixed, the rotating color panel moves from its neutral angle to zero degrees. The stationary shaded receiver visibly loses red in the turned state. That clears the offline art-direction comparison; it is an image-space diagnostic after display transform, not a measurement of linear irradiance or proof of Unreal Lumen behavior.",
    media: [
      {
        kind: "image",
        src: "/lab/light-pavilion/panel-rotation-comparison.gif",
        reducedMotionPoster: "/lab/light-pavilion/neutral.png",
        alt: "Animated comparison of the Light Pavilion with its red panel at the neutral angle and then turned away, while the shaded receiver changes color.",
        label: "Offline comparison · accepted",
        caption:
          "Three seconds per frame: neutral panel angle, then panel turned to zero degrees. Actual matched Blender CPU renders; GIF palette quantization is an encoding limitation and the source PNGs remain authoritative.",
      },
    ],
  },
  {
    date: "Next build",
    title: "Transfer the matched comparison into Unreal",
    status: "next test",
    body:
      "The offline comparison now reads. The next step is to reproduce its fixed camera, sun, receiver, and two panel states in the Unreal fork, verify import and Lumen behavior, then run the same GI-on/GI-off comparison on physical Apple Vision Pro M5 hardware. Mixed reality can be explored separately after the opaque build works.",
    notes: [
      "Unreal import, basis, pivot, material, and collision checks",
      "Matched panel-state comparison with Lumen on and off",
      "Opaque on-device Apple Vision Pro M5 capture",
      "Frame-time and thermal notes from a sustained device run",
    ],
  },
];

export default function LightPavilionDevlog() {
  return (
    <SpatialLabDevlog
      productName="Light Pavilion"
      eyebrow="Development log · render study"
      title="Can reflected light become a room-scale material?"
      intro="A chronological record of the Light Pavilion as it moves from a compact offline scene toward Lumen on an Unreal fork and a standalone Apple Vision Pro M5 build. Render captures and device captures are labeled separately; failed images remain in the sequence when they change the next decision."
      entries={entries}
      nextMedia={[
        "Matched Lumen on/off stills from the Unreal fork",
        "Interaction GIF once panel and shutter controls work in Unreal",
        "Opaque Apple Vision Pro M5 GI comparison capture",
        "Sustained device video with frame-time and thermal notes",
      ]}
    />
  );
}
