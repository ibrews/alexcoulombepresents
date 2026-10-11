export const harborfolkUrl = "https://harborfolk-sam.ibrews.chatgpt.site";
export type DiaryEntry = { id: string; title: string; date: string; version: string; paragraphs: string[]; images: { src: string; alt: string; caption: string }[] };
export const harborfolkDiary: DiaryEntry[] = [
  {
    id: "bring-the-cart-to-the-woods", title: "Bring the cart to the woods", date: "2026-10-11", version: "v0.3 cart and chat · shipped",
    paragraphs: [
      "The cart can now go where the work is. Click it and right-click clear land near the woods. An available villager walks to its handles and pulls it along a land route. Nearby gatherers use the cart when it is closer than the storehouse.",
      "Each deposited log appears on the cart, up to a stack of twenty-four. That timber stays on board until the operator brings it home and unloads it. Deliver timber sends it to the storehouse; each unloaded log becomes spendable. Redirecting or stopping the cart preserves its load. The original supply voyage still works, with crates appearing as the cart is loaded.",
      "Connected co-op players also have a collapsible chat window and an unread badge. Typing stays separate from game shortcuts. Messages travel over the same direct connection as orders, with the latest fifty kept in the current page. This is chat with one invited partner; joining still uses the invitation and answer codes.",
      "The combined build passed fifty-one automated tests, fourteen cart browser checks, and a real co-op playtest in two separate browsers. That playtest sent cart orders from the guest, exchanged messages in both directions, checked narrow controls and disconnect behavior, and confirmed that message text renders literally. The cart captures use actual gathering and delivery orders, with the real simulation advanced for testing. Human playtesting is the next check."
    ],
    images: [
      { src: "/lab/harborfolk/timber-cart.webp", alt: "A Harborfolk cart parked near the woods with a stack of twenty-four individually rendered logs", caption: "A full cart beside the woods. Its visible logs match the timber waiting to be delivered." },
      { src: "/lab/harborfolk/coop-chat.webp", alt: "Two connected Harborfolk players coordinating timber gathering through the chat panel", caption: "An actual two-browser co-op conversation, carried by the game's direct connection." }
    ]
  },
  {
    id: "click-a-person-give-them-a-job", title: "Click a person, give them a job", date: "2026-10-11", version: "v0.3 controls · shipped",
    paragraphs: [
      "The next request was the familiar strategy-game gesture: click a person, then right-click the thing they should work on. Trees mean gathering; a farm means food; a quarry means stone; an unfinished building means construction. A boat takes the selected people as its crew, and the cart takes an operator. Empty ground still means move.",
      "Farm and quarry workers can switch jobs directly. Small construction and income crews now stand at offset work positions, making individual villagers easier to select. Resuming a building does not charge for its materials again. Co-op uses those same orders; a tree-click coordinate also needed a fix to pass the shared command validation.",
      "You choose sites for all seven settlement building types through Build. A footprint checks explored land, water, obstacles, and people before the villagers walk there. Right-click or Escape cancels placement. The original dock and workshop still use their fixed locations.",
      "For WebXR, Little Cities is a reference for a calmer tabletop interface. The controller prototype now has a labeled building bubble palette inside the headset, age locks, selection and resource feedback, and buttons to scale or rotate the table. Trigger selects or places; squeeze gives a contextual order or cancels the active placement. A green or red footprint previews the site.",
      "Automated checks cover controller callbacks and restoring the desktop camera. The browser playtests use actual mouse selection, farm and quarry orders, construction placement, and boarding a cutter with three occupied roles. Physical headset comfort and controller feel remain untested; this update does not add hand tracking."
    ],
    images: [{ src: "/lab/harborfolk/contextual-farming.webp", alt: "Selected villagers working at separated stations around a Harborfolk farm", caption: "A working farm from the mouse playtest, with people selected and assigned in the world." }]
  },
  {
    id: "from-a-dock-to-a-working-town", title: "From a dock to a working town", date: "2026-10-11", version: "v0.3 · shipped",
    paragraphs: [
      "The harbor now has a small city economy. Villagers walk to building sites, raise their structures, tend farms, and quarry stone. Cottages add room for more people. A warehouse trades food for timber and stone, so the settlement can keep growing after the nearby trees are gone.",
      "Settlement, Harbor, and Citadel ages give that growth a direction. Eight technologies form a prerequisite tree, with useful changes to harvests, construction, ships, and defense. An academy and barracks are buildings you need to finish, rather than menu unlocks that appear by themselves.",
      "Guards, archers, and watchtowers add the first land battles. Peaceful mode lets you choose when to try a raid. Adventure mode allows automatic raids but gives damaged buildings a way to recover; Hard mode allows destruction. The opening screen also lets you name the harbor, choose its banner, and change the landscape.",
      "Two browsers can now command the same settlement through direct co-op. One browser runs the simulation; the other sends orders and receives updates, with its own camera and selection. Moving people and ships ease between those updates. Joining currently means exchanging invitation and answer codes, and some networks will need a relay we have not added yet.",
      "There is also a WebXR tabletop view for compatible VR browsers, with a scale control and controller selection. Automated checks cover entering, leaving, and restoring the desktop view. Headset comfort and controller feel still need a physical playtest.",
      "This build passed 43 automated tests, the original cargo and naval browser playtests, a complete city progression playtest, and a real two-browser co-op test. The city captures below come from ordinary game orders with the actual simulation advanced for testing. No resources or units were injected. The next verdict belongs to my kid.",
      "2026-10-11 adjustment: the boats now turn more quickly in response to a new heading. The cargo boat, cutter, and raider use the same faster response, and their crew stations follow the hull."
    ],
    images: [
      { src: "/lab/harborfolk/city-farm.webp", alt: "Villagers tending a newly constructed Harborfolk farm", caption: "Food comes from assigned people who have reached the farm." },
      { src: "/lab/harborfolk/city-research.webp", alt: "Harborfolk's Citadel Age and technology research panel", caption: "Three ages and a technology tree with real prerequisites." },
      { src: "/lab/harborfolk/city-battle.webp", alt: "Guards defending the Harborfolk settlement from land raiders", caption: "The first land raid, with selected defenders and visible opponents." },
      { src: "/lab/harborfolk/city-town.webp", alt: "A working Harborfolk town with placed buildings", caption: "A settlement built through play, ready for the next human playtest." }
    ]
  },
  {
    id: "a-building-that-grows", title: "An upgrade you can watch being built", date: "2026-10-11", version: "v0.2 · shipped",
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
    id: "people-make-the-harbor", title: "Start with a boat that needs people", date: "2026-10-11", version: "v0 · shipped",
    paragraphs: [
      "My kid loves Age of Empires and keeps asking for a version where people, ships, and buildings share a believable scale. He also wants to see who is actually operating the vehicles. Harborfolk starts with that question.",
      "The first small loop has eight villagers, a wooded shoreline, and a boat. Villagers chop timber and carry it home, build a dock, load supplies, and deliver them across the water. The cargo boat needs two people, visibly rowing and steering. A cart has an operator too.",
      "The world uses one meter per scene unit. Its inhabitants stand about 1.7 meters tall and the first boat is about eight meters long. It is a stylized little settlement, with scale treated as a rule for the assets rather than adjusted separately to fit an icon."
    ],
    images: [{ src: "/lab/harborfolk/village.webp", alt: "Harborfolk's original 3D village and shoreline", caption: "The first playable settlement. These are screenshots, not concept art." }, { src: "/lab/harborfolk/crew.webp", alt: "Three visible villagers operating a cutter", caption: "A later close look at the crew: each occupied station has a job." }]
  }
];
