export type EvidenceSurface = "Unreal desktop preview" | "PICO emulator" | "Quest 3 headset";

export type DiaryImage = {
  src: string;
  alt: string;
  caption: string;
  surface: EvidenceSurface;
};

export type BackendRow = {
  route: string;
  measured: string;
  result: string;
  status: "measured" | "partial" | "not-run";
};

export const surrealMindsBackendRows: BackendRow[] = [
  {
    route: "On the headset",
    measured: "Memory Portal: 20.0 s on Quest 3 in v13; 26.4 s in the later v14b run",
    result: "SmolVLM-500M produced the right sunset caption. The image encoder, not text generation, dominated the wait.",
    status: "measured",
  },
  {
    route: "Studio PC over LAN",
    measured: "Depth Anything V2 Small: 0.5–0.7 s after a one-time model load of about 25 s",
    result: "The bridge returned the 96×72 depth grid used by the Quest photo-world test. A full matched caption comparison is still pending.",
    status: "partial",
  },
  {
    route: "Remote cloud API",
    measured: "Not run yet",
    result: "No latency, cost, or image-quality result exists yet. This row stays empty until the same fixture is tested.",
    status: "not-run",
  },
];

export const surrealMindsImages: DiaryImage[] = [
  {
    src: "/lab/surreal-minds/memory-editor-photo-world.webp",
    surface: "Unreal desktop preview",
    alt: "A warm sunset scene in Memory Portal with black palm silhouettes, a glowing arch, a framed source photo and a dock",
    caption:
      "The v14 photo-world in Unreal's desktop -game preview. It proved the reprojection, depth grid, lighting response and composition before the headset run; it is not a headset capture.",
  },
  {
    src: "/lab/surreal-minds/memory-pico-emulator.webp",
    surface: "PICO emulator",
    alt: "Memory Portal's teal atlas in the PICO emulator with flower banks, mountains, a dock, rings and a framed winter photo",
    caption:
      "A native PICO emulator render after the instanced-material fix, with its known red/blue channel swap corrected. This run used the opt-in studio-PC bridge because the x86 emulator cannot execute the ARM on-device model.",
  },
  {
    src: "/lab/surreal-minds/memory-quest-v14b.webp",
    surface: "Quest 3 headset",
    alt: "A native Quest 3 eye render of Memory Portal turned toward the edge of a sunset photo world, with the source photo and result text visible",
    caption:
      "Native Quest 3 eye evidence from v14b. The read completed in 26.4 seconds, but turning about 45 degrees exposed the photo mesh's hard edge, black void and leftover template scenery.",
  },
  {
    src: "/lab/surreal-minds/tabletop-es31-editor-sheet.webp",
    surface: "Unreal desktop preview",
    alt: "Four mobile-preview frames of Living Tabletop showing a small island board as trees grow and the lighting changes",
    caption:
      "Living Tabletop v15 in ES3.1 mobile preview: the scripted sequence shows the board filling with trees, a win state and a cooler lighting variation. These are editor-preview frames, not a Swan performance result.",
  },
  {
    src: "/lab/surreal-minds/creature-es31-editor-sheet.webp",
    surface: "Unreal desktop preview",
    alt: "Four mobile-preview frames of Creature Home showing a mint-green creature, a fuller garden and a kitchen bowl with steam",
    caption:
      "Creature Home v10 in ES3.1 mobile preview: snack, play, garden growth and the kitchen sequence. Physical hand feel, audio mix and GPU cost remain unmeasured on the Swan.",
  },
];
