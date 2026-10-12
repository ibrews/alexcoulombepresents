export const harborfolkUrl = "https://harborfolk-sam.ibrews.chatgpt.site";
export type DiaryEntry = { id: string; title: string; date: string; version: string; paragraphs: string[]; sources?: {title:string;url:string}[]; images: { src: string; alt: string; caption: string }[] };
export const harborfolkDiary: DiaryEntry[] = [
  {
    "id": "small-plans-and-people-to-follow",
    "title": "Small plans, and people to follow",
    "date": "2026-10-12",
    "version": "v0.3 plans and patrols · shipped",
    "paragraphs": [
      "Plans turns the sandbox into three small optional adventures. First crossing guides a dock, crew, and twenty-supply outpost delivery. Woodland Supply follows a farm and an extra cart through its first timber run. Coastal Watch asks for a scout, a mainland discovery, two guards, and a raid victory. The next goal and a practical hint stay in view.",
      "Each plan keeps its checklist, elapsed simulation time, and completion badge with the saved harbor. Existing accomplishments count, and returning to free play preserves the village. The opening customization screen can choose a plan. Two co-op players share the same progress, so one can build while the other explores.",
      "Units also have duties that continue after a single move. Select a guard, scout, archer, or medic, press P, and right-click the far end of a patrol route. Press E and right-click a villager, cart, or friendly unit to escort it. A selected unit shows a dashed route or connecting line. Guards and archers respond to nearby threats and resume their duty; scouts stay out of combat until ordered, and medics still heal nearby wounded allies.",
      "Escorts follow actual positions and use land paths. They wait and retry if a route is blocked, rather than jumping through buildings or water. Stop or an ordinary move or attack clears the routine. Saved routines and guest orders use the same validated state as the rest of the game. Headset-native patrol and escort buttons remain future work; the target resolver is shared with the controller adapter.",
      "The build passed 76 automated tests, a browser adventure using real gathering, construction, crewing and cargo delivery, and real two-browser co-op checks for shared plans and guest patrol and escort orders. The captures below come from gameplay, with the simulation advanced for testing. Physical headset comfort and performance on the child's computer remain unmeasured."
    ],
    "images": [
      {
        "src": "/lab/harborfolk/harbor-plans.webp",
        "alt": "Harborfolk's Plans panel after a real cargo delivery completed the First crossing adventure",
        "caption": "A first crossing, completed through gathering, building, boarding, and an outpost delivery."
      },
      {
        "src": "/lab/harborfolk/scout-patrol.webp",
        "alt": "A selected Harborfolk scout following a dashed patrol route",
        "caption": "A scout patrols between its starting position and the chosen endpoint."
      },
      {
        "src": "/lab/harborfolk/villager-escort.webp",
        "alt": "A Harborfolk scout escorting a moving villager with a visible connecting line",
        "caption": "The escort follows a person who is actually walking, with a land route and room to stop nearby."
      }
    ]
  },
  {
    id: "more-places-more-useful-people", title: "More places, more useful people", date: "2026-10-12", version: "v0.3 Polyfork expansion · shipped",
    paragraphs: [
      "A Scout Lodge, Harbor Market, and Infirmary give the next group of people useful jobs. Scouts move faster and reveal more coast, with an attack order needed before they engage. A market trader has to reach a stall before exchanging food for timber or stone. Medics train at the infirmary and heal nearby living allies after a fight.",
      "The expansion uses six additional free Polyfork models: a tool shed and trail-map kiosk for the lodge, an oven and drying-net rack for the market, a hand axe for the scout, and potion bottles for the medic and clinic. Existing stalls, barrels, sacks, and the Beach Hut generator supply the remaining bases. The animated people remain the original humanoids, with Polyfork equipment attached. Everything is placed in meters; doors, props, and people keep their scale.",
      "For a possible Polyfork case study, the build retains each source page, free-status check, license check, file hash, measured dimensions, and geometry budget. The six new source models total 2,777 triangles, with one material and no textures each. Those are asset figures, not a claim about the game's frame rate. Models ship inside the game. This is an independent prototype; no Polyfork partnership or endorsement is claimed.",
      "The RTS research points toward readability, guidance, co-op scenarios, and distinctive rosters. The Age of Empires team highlights tree and wall visibility, idle-worker warnings, and guided build orders among its popular mods. Forgotten Empires reports over a million official downloads before becoming official game content, while Mental Omega pairs a distinctive roster with extensive solo and co-op missions. These are directional signals from named projects and platforms, rather than a representative survey of all RTS players.",
      "This batch applies the smaller lessons first: an Idle button and I shortcut, local selection groups on Ctrl plus 1–4, and optional see-through trees without shrinking them. Decorative trees yield to building footprints, while timber-bearing trees still have to be cleared normally. Short shared scenarios, patrol and escort orders, and regional rosters are promising next experiments. Deeper naval logistics also fit Harborfolk, though the direct popularity evidence is weaker.",
      "The build passed 62 automated tests, the existing 29-check city playtest, and eighteen new browser checks covering real construction, scouting, staffed trade, actual raid damage and medic healing, saved reload, and narrow controls. Two separate browsers also built a Scout Lodge and trained a scout through the real co-op connection. The images below are gameplay captures. Human feedback, target-device frame rates, and physical headset comfort remain future checks."
    ],
    sources: [
      {title:"Polyfork licensing",url:"https://polyfork.dev/licensing"},
      {title:"Polyfork agent API and asset contracts",url:"https://polyfork.dev/agents"},
      {title:"Age of Empires' popular mod spotlight",url:"https://www.ageofempires.com/news/mods-122020/"},
      {title:"Popular usability features adopted into AoE",url:"https://www.ageofempires.com/news/e3-2019-demo-recap-with-forgotten-empires/"},
      {title:"Forgotten Empires' original project history",url:"https://www.forgottenempires.net/fe"},
      {title:"Mental Omega's project page",url:"https://www.moddb.com/mods/mental-omega"}
    ],
    images: [
      {src:"/lab/harborfolk/scout-lodge.webp",alt:"Harborfolk's Scout Lodge built from a Polyfork shed and trail-map kiosk, with a newly trained scout",caption:"A compact lodge assembled from real-meter models, with the first scout outside."},
      {src:"/lab/harborfolk/harbor-market.webp",alt:"A working Harbor Market with a trader, stalls, bread oven and drying-net rack",caption:"Asha has arrived at a market stall. Trading becomes available when the assigned person is there."},
      {src:"/lab/harborfolk/infirmary.webp",alt:"The Harborfolk Infirmary with a medic and villager outside",caption:"A one-bay Beach Hut becomes the clinic, with access stairs and a medic carrying a potion bottle."},
      {src:"/lab/harborfolk/medic.webp",alt:"A Harborfolk medic treating a surviving guard after a real land raid",caption:"A living guard was wounded in battle. The medic walked over and restored health within range."}
    ]
  },
  {
    id: "a-cart-that-knows-the-way-home", title: "A cart that knows the way home", date: "2026-10-11", version: "v0.3 automatic carts · shipped",
    paragraphs: [
      "The next request was to let the cart finish its own work loop. Moving it to a woodland loading spot now assigns a dedicated operator and enables automatic hauling. When twenty-four logs are aboard, that person pulls it home, unloads it one log at a time, and brings the empty cart back to the same spot.",
      "The operator waits at the handles while gatherers fill it again. Each cart has an automatic-hauling toggle and a Stop button. Deliver timber can send a partial load home too. The timber stays aboard when a journey is stopped, and saved routes retain their loading spot and operator.",
      "More carts can be built through Build, the storehouse, or a cart panel. Each costs twenty wood. A villager walks to the assembly site and builds its parts over eight seconds; interrupted work can resume without paying again. Up to six carts have their own loads, routes, and people. Gatherers choose the nearest useful parked cart.",
      "This build passed fifty-seven automated tests, the fourteen manual-cart browser checks, and eighteen new checks covering repeated automatic deliveries, visible assembly, a second cart receiving real timber, saved loads, narrow controls, and reset cleanup. In two separate browsers, the guest also built and positioned a second cart through the shared game connection. The browser tests advance the actual simulation and use normal orders and harvested resources. Human playtesting is still ahead."
    ],
    images: [
      { src: "/lab/harborfolk/automatic-haul.webp", alt: "A full Harborfolk timber cart with its assigned operator at the handles", caption: "The load is full. Its operator is starting the trip home, then will return to this loading spot." },
      { src: "/lab/harborfolk/cart-assembly.webp", alt: "Mara assembling the wooden platform of an additional Harborfolk cart", caption: "A second cart begins with a frame. Its villager has arrived and is building the remaining parts." }
    ]
  },
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
