export const harborfolkUrl = "https://harborfolk-sam.ibrews.chatgpt.site";
export type DiaryEntry = { id: string; title: string; date: string; version: string; paragraphs: string[]; sources?: {title:string;url:string}[]; images: { src: string; alt: string; caption: string }[] };
export const harborfolkDiary: DiaryEntry[] = [
{
  "id": "a-world-to-return-to",
  "title": "A world to return to",
  "date": "2026-10-12",
  "version": "v0.3 saves, scenarios and editor · shipped",
  "paragraphs": [
    "The next request was less about another building and more about keeping a world: build a civilization together, save it, and return to it. The Saves library now keeps named harbors beside the automatic browser save. Jobs, crews, trade routes, paid construction, technology and explored terrain return with the people who were doing the work.",
    "Scenarios gives you three starting points: a busy working harbor, a defended Citadel, and a maritime city with the enormous Hall and Great Warship. These are authored starting civilizations, with deliberately supplied resources and completed projects. Their farmers, merchants and crews run the actual simulation. They are useful places to explore what the prototype can become, rather than claims that every screenshot was earned from an empty map.",
    "The Map Editor opens an isolated, paused copy. Paint land and water, place buildings and people, move objects by their coordinates, staff a vessel, and choose starting resources, age and fog. Terrain uses an eight-metre authoring grid; navigation, ordinary city construction and the rendered coastline use the same data. The town can grow beyond the starter harbor and onto an authored island when builders can reach it. Buildings, ships and villagers retain their metre dimensions.",
    "Undo and Redo keep the recent edit history. Validate checks the draft, and Play test runs a disposable copy with ordinary game controls. Back to editor restores the draft. Return to harbor restores the original settlement and camera, leaving its autosave intact. The fixed starter harbor and infrastructure corridors remain protected, and the existing population and fleet caps still apply.",
    "A custom scenario or saved civilization can be exported as a JSON file and imported in another browser. For co-op, the host loads that world first and creates a fresh invitation; the other player joins its restored state. You can save the shared progress and repeat that process next time. The file preserves the civilization, while the direct connection and local camera are recreated. There is still one guest, manual invitation exchange and no relay service.",
    "A reported endless loading screen also prompted recovery work. Asset progress now shows what is opening, and bounded loading offers retry and export of the retained save. A separate guard covers the case where the main application script never finishes opening. A fresh public browser loaded successfully during investigation; that did not by itself reproduce the reported failure.",
    "The screenshots are actual captures of the published build. It passed 152 automated tests, browser checks for edited terrain, save files, developed worlds and return-from-play-test recovery, plus three deliberate loading-failure checks. Two independent browsers also joined an edited civilization, issued a shared order, saved the job in progress, reloaded and reconnected to finish it. Physical headset comfort, performance on the child’s computer and the next family playtest remain open checks."
  ],
  "images": [
    {
      "src": "/lab/harborfolk/scenario-grand-maritime.webp",
      "alt": "A huge Hall and launched warship overlook a developed Harborfolk town",
      "caption": "An authored civilization, with the same human and building scale as a new settlement."
    },
    {
      "src": "/lab/harborfolk/named-harbor-saves.webp",
      "alt": "Harborfolk save library showing named saved worlds and export controls",
      "caption": "Named moments, portable files and a previous harbor kept for recovery."
    },
    {
      "src": "/lab/harborfolk/scenario-editor-inspector.webp",
      "alt": "A full-size cottage selected in the Harborfolk map editor with coordinate controls",
      "caption": "The editor moves a footprint through the world; it does not shrink the building."
    },
    {
      "src": "/lab/harborfolk/scenario-editor-mobile.webp",
      "alt": "Narrow Harborfolk screen with the map editor occupying its lower half",
      "caption": "A compact editor leaves the upper playfield available for painting and placement."
    }
  ]
},
{
  "id": "wait-it-is-that-big",
  "title": "Wait… it’s that big?",
  "date": "2026-10-12",
  "version": "v0.3 full-scale landmarks · shipped",
  "paragraphs": [
    "The next rule was simple: keep everything at scale, even when it gets inconvenient. The playable map now spans 640 by 480 metres. The camera can inspect a doorway or pull back over the coast. Fog follows that larger geography, and a Great Warship needs open sea instead of squeezing through the little cargo channel.",
    "The Great Hall takes its roof plan from Westminster Hall: 73.2 by 20.7 metres. Villagers stay about 1.72 metres tall. You choose a surveyed, clear site and pay its actual material cost. Stone courses, thirteen timber trusses, roof bays and coverings appear as separate full-size pieces. The total height and exterior treatment are prototype choices; this is a stylized reference building rather than a complete historical reconstruction.",
    "Construction depends on people reaching the site. Builders walk to work stations and climb to the stage they are working on. Stopping sends them safely down; resuming keeps the paid materials and existing parts. Small city buildings now assemble by courses and bays too. Dock production uses arrived shipwrights, with the keel, ribs and hull appearing as work progresses.",
    "The Great Warship takes its main dimensions from Vasa: 69 metres overall, an 11.3-metre hull beam, and 52.4 metres from keel to mainmast top. Its broader yards need more space than the hull alone. Building starts with a bottom shell before inserted frames, then planking, decks, masts, rigging and sails—a simplified nod to the documented Dutch construction method. A finished ship launches once, lowers into the water and joins the fleet.",
    "Eight actual villagers occupy playable duties: helmsman, lookout, two gunners, sail trimmer, rigger, carpenter and quartermaster. Vasa was designed for roughly 145 sailors and 300 soldiers. Those eight stations are a gameplay crew, not a claim to reproduce that entire complement. No extra decorative people are spawned to suggest a staffed ship.",
    "The Scale panel fits a project in view, takes you close to the Hall doorway, and offers stone and sailcloth colours. A cutaway reveals the timber structure without changing its size. Cosmetic changes stay local and cost nothing. Two co-op players can place and build the same Hall while keeping their own camera views.",
    "The build passed 119 automated tests, plus browser checks for earned materials, surveyed footprints, stopped and saved construction, launch, occupied duties and repeated convoy trips. Two independent browsers also exercised guest placement, safe descent and resumed Hall construction over the real direct connection. The pictures are gameplay captures with the actual simulation advanced for testing. Physical headset comfort and performance on the child’s computer remain unmeasured."
  ],
  "sources": [
    {
      "title": "UK Parliament: Westminster Hall roof dimensions",
      "url": "https://www.parliament.uk/about/living-heritage/building/palace/westminsterhall/architecture/the-hammer-beam-roof-/"
    },
    {
      "title": "Vasa Museum: the ship’s overall length",
      "url": "https://www.vasamuseet.se/en/explore/vasa-history/timeline"
    },
    {
      "title": "Vasa Museum: keel-to-mainmast height",
      "url": "https://faq.vasamuseet.se/category/45/article/4707?lang=en"
    },
    {
      "title": "Vasa Museum: hull beam",
      "url": "https://www.vasamuseet.se/en/explore/collections/find-in-focus/espingen---vasas-longboat"
    },
    {
      "title": "Vasa Museum: Dutch construction method",
      "url": "https://faq.vasamuseet.se/category/45/article/24515?lang=en"
    },
    {
      "title": "Vasa Museum: planned crew and soldiers",
      "url": "https://www.vasamuseet.se/besok/utstallningar/livet-ombord"
    }
  ],
  "images": [
    {
      "src": "/lab/harborfolk/hall-construction.webp",
      "alt": "Harborfolk villagers on scaffold ladders while separate full-size Great Hall roof trusses appear",
      "caption": "Reached work stations, stone courses and separate trusses. The people keep their height as the Hall takes shape."
    },
    {
      "src": "/lab/harborfolk/hall-full-scale.webp",
      "alt": "A completed enormous Great Hall with several small human-sized villagers beside it",
      "caption": "A long roof and tiny-looking people, sharing the same metre scale."
    },
    {
      "src": "/lab/harborfolk/hall-doorway.webp",
      "alt": "A close view of the Great Hall entrance steps with two villagers beside its fixed-size door",
      "caption": "Getting close brings the doorway and people back into view. Their dimensions stay fixed."
    },
    {
      "src": "/lab/harborfolk/great-warship-construction.webp",
      "alt": "A Vasa-inspired Great Warship under construction with masts and real assigned builders",
      "caption": "The hull, decks and masts assemble as separate parts, with actual builders at their stations."
    },
    {
      "src": "/lab/harborfolk/hall-cutaway.webp",
      "alt": "A narrow browser view of the Great Hall with its roof covering hidden to reveal the timber structure",
      "caption": "Peek inside changes visibility, leaving the structure’s scale intact."
    },
    {
      "src": "/lab/harborfolk/great-warship-launched.webp",
      "alt": "A launched full-size Great Warship with towering masts and villagers visible at occupied deck stations",
      "caption": "The finished hull joins the fleet with eight occupied roles. The spars and rigging tower over the crew."
    }
  ]
},
{
  "id": "ships-with-jobs-and-company",
  "title": "Ships with jobs, and company",
  "date": "2026-10-12",
  "version": "v0.3 convoys · shipped",
  "paragraphs": [
    "Up to six ships can share the harbor. The dock builds additional cargo boats and warships, each with its own berth and crew. Cargo boats need two people; warships need a rower, helmsman, and gunner. People walk to their assigned ship, and a hull waits until its crew is aboard.",
    "A repeat trade route spends twenty actual supplies. Crew members carry exports aboard, sail to the outpost, and take them ashore. They then collect imports and bring them home. Timber and stone become spendable only when those imports are unloaded at the harbor. The route repeats while supplies and crew are available; a low stock pauses it rather than conjuring another load.",
    "Select a crewed warship and right-click a cargo boat to escort it, or choose that boat in the ship panel. Its escort follows a reachable position with room between the hulls and engages the raider when the convoy is threatened. Multiple arrivals queue for the outpost berth. Stop disables repetition, while people finish handling a paid manifest safely.",
    "This draws from Anno’s automatic trade routes, stock safeguards and separate piers, Homeworld’s guard and support orders, and 0 A.D.’s crewed trading ships. The research keeps official features, developer plans, qualitative requests and dated mod attention separate. These are useful references, rather than a ranking of every RTS player’s wishes.",
    "The metre rule is still the center of the project. These boats retain their eight-metre hulls, human-sized people and individually visible crates. A much larger geography and evidence-backed Great Hall and Vasa-inspired ship are under development. Their roof, hull and mast dimensions will dictate the space they need. They are not yet part of this published convoy milestone.",
    "The integrated build passed 104 automated tests. The browser checks exercise normal resource gathering, repeated paid trips, actual cargo handling, escort combat, reload and two-browser guest commands. Dock ship production still uses a timed assembly queue; arrived shipbuilders and staged construction are the next milestone. The screenshots below are real gameplay captures with the simulation advanced for testing."
  ],
  "sources": [
    {
      "title": "Anno: automatic trade routes",
      "url": "https://www.anno-union.com/devblog-your-own-trading-empire/"
    },
    {
      "title": "Anno: escort improvements",
      "url": "https://www.anno-union.com/updates/10375/"
    },
    {
      "title": "Homeworld: guard and support feedback",
      "url": "https://www.homeworlduniverse.com/war-games-feedback/"
    },
    {
      "title": "0 A.D.: trading ship components",
      "url": "https://docs.wildfiregames.com/entity-docs/a25.html"
    }
  ],
  "images": [
    {
      "src": "/lab/harborfolk/convoy-loading.webp",
      "alt": "Villagers carrying individual export crates along a Harborfolk pier to their cargo boat",
      "caption": "Loading starts with two people collecting real supplies and carrying them aboard."
    },
    {
      "src": "/lab/harborfolk/convoy-home-unloading.webp",
      "alt": "Two Harborfolk crew members unloading imported cargo at their home pier",
      "caption": "A completed trade trip becomes spendable timber and stone as the crew unloads it."
    },
    {
      "src": "/lab/harborfolk/convoy-fleet.webp",
      "alt": "Multiple individually crewed cargo boats and a warship at separate Harborfolk piers",
      "caption": "Each hull has its own berth, cargo, orders, and people."
    }
  ]
},
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
