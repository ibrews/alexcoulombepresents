export const harborfolkUrl = "https://harborfolk-sam.ibrews.chatgpt.site";
export type DiaryEntry = { id: string; title: string; date: string; version: string; paragraphs: string[]; images: { src: string; alt: string; caption: string }[] };
export const harborfolkDiary: DiaryEntry[] = [
  {
    id: "a-building-that-grows", title: "An upgrade you can watch being built", date: "October 11, 2026", version: "v0.2 · shipped",
    paragraphs: [
      "The next experiment was a workshop that changes while villagers work on it. Polyfork supplies a parameterized building: the upgrade adds another bay and steepens the roof in visible stages. Doors stay people-sized as the building grows.",
      "Paint, roof color, and weathering are separate controls. They are there to play with, without spending the resources needed for a functional upgrade. The finished workshop earns fishing supplies.",
      "The same update adds unexplored coast, a dock production queue, and a cutter with three occupied stations: rower, helmsman, and gunner. A raider pursues and fights the crewed ship. Music, footsteps, tools, and battle sounds are synthesized in the browser.",
      "This release passed 14 simulation tests and 34 automated browser checks. The captures below come from that working build. Camera orbit, close inspection, and a wide overview all use the same 3D world. The next playtest with my kid is still ahead."
    ],
    images: [
      { src: "/lab/harborfolk/workshop-before.webp", alt: "Harborfolk workshop before its upgrade", caption: "Before: one bay, with people-sized doors." },
      { src: "/lab/harborfolk/workshop-building.webp", alt: "Villagers working on an expanding workshop", caption: "During: villagers walk to the site and build while its parameters change." },
      { src: "/lab/harborfolk/workshop-after.webp", alt: "Completed two-bay workshop with cosmetic controls", caption: "After: a second bay, a steeper roof, and cosmetic controls." },
      { src: "/lab/harborfolk/ship-battle.webp", alt: "A crewed cutter confronting a raider at sea", caption: "The first naval encounter, with people at their stations." }
    ]
  },
  {
    id: "people-make-the-harbor", title: "Start with a boat that needs people", date: "October 11, 2026", version: "v0 · shipped",
    paragraphs: [
      "My kid loves Age of Empires and keeps asking for a version where people, ships, and buildings share a believable scale. He also wants to see who is actually operating the vehicles. Harborfolk starts with that question.",
      "The first small loop has eight villagers, a wooded shoreline, and a boat. Villagers chop timber and carry it home, build a dock, load supplies, and deliver them across the water. The cargo boat needs two people, visibly rowing and steering. A cart has an operator too.",
      "The world uses one meter per scene unit. Its inhabitants stand about 1.7 meters tall and the first boat is about eight meters long. It is a stylized little settlement, with scale treated as a rule for the assets rather than adjusted separately to fit an icon."
    ],
    images: [{ src: "/lab/harborfolk/village.webp", alt: "Harborfolk's original 3D village and shoreline", caption: "The first playable settlement. These are screenshots, not concept art." }, { src: "/lab/harborfolk/crew.webp", alt: "Three visible villagers operating a cutter", caption: "A later close look at the crew: each occupied station has a job." }]
  }
];
