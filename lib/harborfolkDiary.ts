import type { ArmyBenchmark } from '@/components/HarborfolkBenchmark';
export const harborfolkUrl = "https://harborfolk-sam.ibrews.chatgpt.site";
export type DiaryEntry = { id: string; title: string; date: string; version: string; paragraphs: string[]; benchmark?: ArmyBenchmark; sources?: {title:string;url:string}[]; images: { src: string; alt: string; caption: string }[] };
export const harborfolkDiary: DiaryEntry[] = [
{
  "id": "thirty-ways-to-hold-the-field",
  "title": "Thirty ways to hold the field",
  "date": "2026-10-20",
  "version": "v0.3 Thirty Banners · shipped",
  "paragraphs": [
    "The next request was to make the big battle into a scenario, then give it at least thirty different units with their own art and animations. Thirty Banners opens with three thousand Azure troops facing three thousand Crimson, split into thirty regiments on each side. The briefing waits while you look around. Reinforcements are off: defeat the Crimson army while keeping someone alive.",
    "The roster runs from swords, pikes, shields and polearms through bows, crossbows, slings and early firearms to mounted scouts, lancers, armored cavalry, horse archers, a camel rider and a dragoon. A banner captain, duelist, staff fighter and torch raider complete the thirty. Each has original procedural geometry, defining equipment and individually authored movement and attack poses. Speed, armor, reach, range, damage and attack cadence give the models different combat profiles. This is still simplified combat rather than thirty finished special-ability systems.",
    "Unit roster lets you meet them one at a time. Search for a name or weapon, orbit and zoom, and switch between Idle, Walk and Attack. These are the actual game models and shader motions, rather than artwork prepared for a separate gallery. Command this type selects that troop’s living Azure regiments. The inspector stays local to your camera, leaves a connected battle running, and hides the battle FPS counter so one person on an empty field cannot masquerade as a mass-battle result.",
    "The size rule keeps applying. A standing person has 1.717 metres of anatomy, with helmets adding their own height. Riders keep full-length limbs, and the horses and camel occupy metre-scale footprints. A long pike remains long at both geometry detail levels. Pulling the camera back reduces detail, never the people’s world scale.",
    "A long finite-combat soak found an enemy behavior problem: rear Crimson regiments could stop with nobody nearby. They now choose living Azure regiments to pursue, while your company orders remain yours. Left to its opening orders, this seeded scenario reaches a natural Crimson victory. Moving and combining the Azure regiments is part of the challenge. A full-population simulation test also proves the scenario can be won using ordinary repeated Charge orders, without altering troop health or enemy behavior. The result screen freezes the final pose and offers a rematch.",
    "The first full-roster WebGPU check also caught a real portability failure. The shader used seventeen vertex-attribute locations, one beyond the default limit, although individual inspection models rendered. That build was rejected. Packing tint and team data together brought the complete layout to sixteen. The automated geometry checks now count actual attribute locations as well as buffer bindings. Rendered populations, shader errors and the real graphics backend are checked before accepting FPS evidence.",
    "The same exact saves and direct two-person co-op carry this roster. A resumed battle retains its individual positions, health, targets, attack timers, replacement generations, regiments and random state. The original two-role Field of Ten Thousand and the harbor and naval scenarios remain available. The new army can also be restarted at other counts, finite or endless; the fifty-thousand slider ceiling remains an experiment.",
    "Browser QA renders all thirty units on both WebGL2 and WebGPU, records their movement and attack poses over time, exercises type selection, restores exact six-thousand and fifty-thousand-person saves, and checks the narrow-screen inspector, finite result and rematch. The automated suite contains 229 tests. Two independent browser processes also exercise actual co-op commands, saved combat and reconnecting. The measurements below apply to this richer thirty-type roster; the previous entry’s simpler army has its own results.",
    "Both real renderers passed the richer ten-thousand-person army for three minutes on FORTRESS with its RTX 5090: about sixty FPS, no frames over the thirty-FPS budget and no dropped simulation time. The worst frames were 17.1 ms on WebGL2 and 17.4 ms on WebGPU. Every frame submitted all ten thousand people across all thirty types, about 3.44 million triangles, with the complete army in view and autosaves enabled. This is a high-end desktop result, not a promised limit for a laptop or headset.",
    "The art is deliberately low-poly and the simulation remains an open-field prototype. Ranged attacks use simplified damage, rather than full projectile flight; there is no siege pathfinding or dismounting system here. The ordinary harbor’s trainable units are a separate roster. Physical headset acceptance and performance on my kid’s computer still need their own tests."
  ],
  "benchmark": {
  "conditions": "Thirty-type roster · 10,000 living troops with reinforcements · FORTRESS / RTX 5090 · Chromium 156 · 1440 × 900 framebuffer · default distant geometry · all army centers in view · 8 s warm-up excluded · autosaves on.",
  "evidenceUrl": "/lab/harborfolk/thirty-banners-performance-2026-10-20.json",
  "rows": [
    {
      "units": 10000,
      "backend": "WebGL2",
      "seconds": 180,
      "fps": 59.972446893609465,
      "p99": 16.800000000017462,
      "max": 17.10000000000582,
      "slowFrames": 0
    },
    {
      "units": 10000,
      "backend": "WebGPU",
      "seconds": 180,
      "fps": 59.972513523812914,
      "p99": 16.800000000046566,
      "max": 17.39999999999418,
      "slowFrames": 0
    }
  ]
},
  "images": [
    {
      "src": "/lab/harborfolk/thirty-banners-clash.webp",
      "alt": "Thirty Banners infantry and cavalry fighting at full metre scale",
      "caption": "Actual published Thirty Banners battle in live play. Mounted and foot troops share the same scale. This on-screen counter includes first-use setup; the table measures separate warmed runs."
    },
    {
      "src": "/lab/harborfolk/thirty-banners-lancer.webp",
      "alt": "Full-size lancer and horse in the Harborfolk unit roster inspector",
      "caption": "The inspector uses the same full-detail model, material and animation data as the army."
    },
    {
      "src": "/lab/harborfolk/thirty-banners-camel.webp",
      "alt": "Camel rider with full-size rider anatomy in Harborfolk",
      "caption": "Different mount, different footprint and gait. Camera distance changes; the person and animal stay at world scale."
    }
  ]
},
{
  "id": "ten-thousand-little-people",
  "title": "Ten thousand little people",
  "date": "2026-10-20",
  "version": "v0.3 Mass-battle laboratory · shipped",
  "paragraphs": [
    "My kid had a new question: could we have a Lord of the Rings sized battle with ten thousand active characters, without dropping below thirty frames per second? That is a useful challenge for Harborfolk. Adding more people only counts if they still move, fight, save and share a world at the same scale.",
    "The Field of Ten Thousand is a separate land scenario. Its default is five thousand Azure soldiers against five thousand Crimson soldiers on a field measuring 1,024 metres across. Army & FPS offers one thousand to fifty thousand characters, a WebGL2/WebGPU comparison, resolution controls and a distant-detail switch. The upper slider limit is an experiment, rather than a promised frame rate. Both model detail levels keep a person 1.717 metres tall.",
    "Each soldier has a position, heading, health, target, attack timer and replacement generation. Companies of up to one hundred share movement orders. Click a soldier to choose a company, Shift adds companies, and right-click sends them somewhere. Attack-move, Charge and Hold work on those actual people. The Crimson army runs its own simple combat behavior. Reinforcement mode keeps the selected population alive by bringing new soldiers from the rear; fallen soldiers and replacements are counted separately.",
    "The architecture work, including an Astra review, concentrated on keeping repeated work small. Typed arrays store the people. A spatial grid and bounded neighborhood queries replace all-pairs searches. Shared meshes animate limbs in the vertex shader instead of maintaining a separate scene object for every limb. Companies share destinations, while individual soldiers still move and take damage. The crowd-pathfinding literature informed that division; this open field does not implement a complete tiled flow-field pathfinder.",
    "The first WebGPU smoke check demonstrated why frame rate alone is weak evidence: a shader exceeded the portable vertex-buffer limit, the army failed to draw, and the browser still reported fast frames. That result was rejected. Interleaving the static attributes fixed the actual rendering failure. The measurements now check the real backend, living and drawn counts, camera coverage, skipped renders, frame intervals and simulation time. Autosaves stay on during a benchmark.",
    "Named saves and exports preserve the exact authoritative soldier arrays, company orders, combat totals and random seed. The existing invitation-and-answer flow supports one other commander. The host runs combat and accepts the guest’s company orders; a local presentation layer smooths the guest between snapshots without inventing another battle. The large full-state snapshots use substantial bandwidth, so this is a direct two-person prototype rather than a claim about a public multiplayer service.",
    "The source passes 212 automated tests. They include finite victories saved after a multi-tick update, exact codec restoration, malformed-data rejection and bounded transport at the maximum army size. Twenty existing browser suites passed 260 named checks plus networking and co-op integration reports; the new army mode adds seven solo and nine two-client checks. They cover real pointer commands, renderer switching, exact 50,000-person named saves, rejoining and the earlier harbor and naval modes. The original eight-metre cutters, 128-metre ironclads and their visible working crews keep their own rules.",
    "On FORTRESS with an RTX 5090, the default ten-thousand-person battle held about sixty FPS for three minutes on each real renderer. The worst recorded frames were 17.2 ms on WebGL2 and 17.1 ms on WebGPU, with zero frames over the 33.3 ms budget and no dropped simulation time. At twenty thousand, WebGPU also passed its one-minute sample; WebGL2 had three borderline 33.4 ms frames. Fifty thousand averaged roughly forty-five to forty-six FPS, but dense combat produced substantial dips. It does not meet the thirty-FPS floor. The table keeps those failures visible.",
    "Disabling distant simplification submitted 2.48 million triangles for ten thousand full-detail people. Both one-minute samples averaged about sixty FPS; WebGL2 recorded one 83.3 ms frame, while WebGPU recorded no frames over budget and a 17.3 ms worst frame. That is a separate test from the default-detail table. Two independent co-op clients on this same machine also shared thirty seconds of warmed ten-thousand-person combat near sixty FPS, with zero over-budget frames or dropped simulation time; it is a short local two-client diagnostic, not a wide-area network guarantee.",
    "These are stylized low-poly people and simplified individual combat on open ground. A high-end RTX 5090 result does not establish the same limit on a laptop. Siege navigation, full soldier physics, richer troop artwork and large public multiplayer remain future work. The XR tabletop currently belongs to harbor scenarios and still awaits physical headset acceptance; these battle scenarios use the desktop view."
  ],
  "sources": [
    {
      "title": "Three.js: instanced geometry",
      "url": "https://threejs.org/docs/pages/InstancedMesh.html"
    },
    {
      "title": "Three.js: WebGPURenderer and TSL",
      "url": "https://threejs.org/manual/pages/webgpurenderer"
    },
    {
      "title": "Elijah Emerson: crowd pathfinding and steering",
      "url": "https://www.gameaipro.com/GameAIPro/GameAIPro_Chapter23_Crowd_Pathfinding_and_Steering_Using_Flow_Field_Tiles.pdf"
    }
  ],
  "images": [
    {
      "src": "/lab/harborfolk/mass-clash.webp",
      "alt": "Thousands of full-size Azure and Crimson soldiers meeting on the battlefield",
      "caption": "Actual published ten-thousand-person battle in Clash view. This gallery counter includes startup; the table samples reset after warm-up."
    },
    {
      "src": "/lab/harborfolk/mass-overview.webp",
      "alt": "The entire ten-thousand-person battlefield and its live WebGPU performance counters",
      "caption": "The complete army remains submitted and simulated in overview. The displayed public verification sample is separate from the three-minute sustained tests."
    },
    {
      "src": "/lab/harborfolk/mass-human.webp",
      "alt": "One full-size animated soldier seen close to person height",
      "caption": "A person stays 1.717 metres tall when you move from the whole army to Human view. This paused close view changes only the camera."
    }
  ],
  "benchmark": {
    "conditions": "FORTRESS · NVIDIA RTX 5090 · Chromium 156 · 1440 × 900 framebuffer · 100% resolution · default distant geometry · all living soldiers submitted and all army centers in view. Warm-up excluded; automatic saves enabled.",
    "evidenceUrl": "/lab/harborfolk/performance-2026-10-20.json",
    "rows": [
      {
        "units": 10000,
        "backend": "WebGL2",
        "seconds": 180,
        "fps": 59.97255540308558,
        "p99": 16.800000000017462,
        "max": 17.200000000004366,
        "slowFrames": 0
      },
      {
        "units": 10000,
        "backend": "WebGPU",
        "seconds": 180,
        "fps": 59.97254683897015,
        "p99": 16.800000000046566,
        "max": 17.100000000034925,
        "slowFrames": 0
      },
      {
        "units": 20000,
        "backend": "WebGL2",
        "seconds": 60,
        "fps": 59.90569104064886,
        "p99": 16.80000000000291,
        "max": 33.400000000001455,
        "slowFrames": 3
      },
      {
        "units": 50000,
        "backend": "WebGL2",
        "seconds": 60,
        "fps": 44.717421827691524,
        "p99": 116.69999999999709,
        "max": 166.8000000000029,
        "slowFrames": 250
      },
      {
        "units": 20000,
        "backend": "WebGPU",
        "seconds": 60,
        "fps": 59.972612506955166,
        "p99": 16.800000000017462,
        "max": 17.10000000000582,
        "slowFrames": 0
      },
      {
        "units": 50000,
        "backend": "WebGPU",
        "seconds": 60,
        "fps": 45.73221451053722,
        "p99": 100,
        "max": 116.80000000001746,
        "slowFrames": 306
      }
    ]
  }
},
{
  "id": "across-the-plank",
  "title": "Across the plank",
  "date": "2026-10-20",
  "version": "v0.3 Boarding Drill · shipped",
  "paragraphs": [
    "The cutters can now take a prize. Boarding Drill starts five Azure cutters opposite five anchored Crimson cutters, with Azure holding fire so there is time to practice. Select cutters, press B and click a red hull. The attackers take stations alongside it at real hull clearances and lay visible planks.",
    "The whole three-person crew leaves its rowing, helm and gun stations to cross. A ship with its crew away cannot keep sailing or firing. Defenders leave their work too. Everyone remains 1.717 metres tall and the cutters remain eight metres long; the boarding gap is actual space between their hulls.",
    "Casualties are permanent. Outnumbered defenders can strike their colors, changing the cutter’s ownership with surviving sailors aboard. Boarders fill missing crew duties and their companions return home. If every defender dies the hull is scuttled instead. Shots already in flight at surrender are removed so a newly captured prize is not immediately hit by its captors.",
    "Plank progress, people crossing, deck fighting, casualties, captured ownership and crew rosters save with the battle. Browser checks verified a mid-fight reload and two independent commanders sharing the same boarding action. This remains cutter-to-cutter boarding; the enormous capital ships retain their much larger clearances and cannot use this tool."
  ],
  "images": [
    {
      "src": "/lab/harborfolk/boarding-crossing.webp",
      "alt": "Full-size sailors crossing a plank between two eight-metre cutters",
      "caption": "Actual published gameplay: crews leave their work stations and cross the boarding plank."
    },
    {
      "src": "/lab/harborfolk/boarding-melee.webp",
      "alt": "Cutters alongside one another with crew fighting on the defended deck",
      "caption": "Deck fighting, casualties and captured ownership belong to the saved shared battle."
    }
  ]
},
{
  "id": "the-leviathans-have-jobs",
  "title": "The leviathans have jobs",
  "date": "2026-10-13",
  "version": "v0.3 Fleet commanders & Leviathans · shipped",
  "paragraphs": [
    "The next overnight milestone puts something much bigger in the strait: two 128-metre ironclads, each with a 17.8-metre beam and 64 named playable crew. Ironclad Showdown is a new scenario; the original 69-metre Sovereign battle remains available. Cutters are still eight metres and people are still 1.717 metres. No zoom trick changes those relationships.",
    "HMS Warrior supplied a useful scale reference. The National Museum of the Royal Navy procurement specification states 128 metres overall and 17.8 metres beam; Royal Museums Greenwich preserves the gun-deck plan. Our mesh is a stylized Warrior-inspired prototype, with a modeled 115.8-metre hull and an open machinery well. It is not a museum reconstruction, and 64 playable work stations are not the full historical complement.",
    "Every crew member has a saved name, health and duty. Engineers and stokers power steam movement; gunners serve the two batteries. Deckhands help reload and marines reduce crew injuries. Helm, lookout, sail trimming, rigging, carpentry and quartermaster duties support steering, range, propulsion, repairs and resupply. Losing a required role affects the ship rather than leaving a decorative empty body. The crew manifest lets you click a person and inspect their station at human scale.",
    "Fleet tactics now include line abreast, column, wedge and screen formations. Destination planning uses the actual hull clearance in metres, translates whole layouts at map edges and rejects impossible arrangements. A huge leader therefore needs a genuinely large amount of sea room. Ships still use conservative navigation circles rather than full rigid-body hull physics.",
    "Attack-move engages along a route. Patrol alternates between two points. Shift-right-click queues up to eight further waypoints; right-clicking a friendly ship gives an escort duty. Escorts reserve stations around the actual leader and switch to guard when it sinks. Guard holds position while firing in range, and Engage, Defensive and Hold fire stances control pursuit and fire discipline. Selected hull health, route lines, steam and wakes add useful feedback.",
    "Those tactics live in the simulation, not just in a menu. A guest can issue them to the shared fleet. Two independent browser processes verified 256 ships and 890 starting crew, guest formation/stance/queued orders, real combat damage, and exact named mid-battle saving. After a fresh invitation, hulls, named crew, duties, casualties, orders and projectiles matched the host again. Co-op remains one guest with manual signaling and local named saves/export, rather than a hosted public lobby.",
    "A follow-up adds two enemy doctrines that the host can change during the same battle. Crimson can hunt the player capital ship or assign real defensive escorts around its own. Switching changes enemy orders, not hull identity, crew or damage; the doctrine and resulting screen synchronize and save. The local Follow ship camera keeps a moving hull in view while preserving the current angle and zoom, and Overview or manual panning releases it. Both features passed actual browser and co-op checks before publication.",
    "The source passed 185 automated tests plus TypeScript and production build checks. Browser tests exercised actual pointer tactics, close crew views, save/reload, renderer switching, narrow-screen crew controls, existing menus, save/editor flows and deliberate loading recovery. The public build repeated the tactics, both maximum-fleet co-op presets, menus and recovery checks. These screenshots were captured from the published game.",
    "The finished ironclad preset was measured after renderer warm-up at 48, 192 and 256 ships on actual WebGL2 and WebGPU. Both held about 60 FPS on the RTX 5090 at 1440 by 900, with up to 890 starting crew. That is a display-paced result, not a maximum throughput ceiling or a claim about another computer. Boarding battles, complete naval engineering, a full historical complement and physical XR acceptance remain future work."
  ],
  "sources": [
    {
      "title": "NMRN: HMS Warrior specification",
      "url": "https://www.contractsfinder.service.gov.uk/Notice/Attachment/9df4365c-7a38-4d1d-9ed4-7239eeb744e9"
    },
    {
      "title": "Royal Museums Greenwich: Warrior gun-deck plan",
      "url": "https://www.rmg.co.uk/collections/objects/rmgc-object-587100"
    }
  ],
  "images": [
    {
      "src": "/lab/harborfolk/ironclad-128m-deck.webp",
      "alt": "A full-size ironclad deck with dozens of small working crew members",
      "caption": "128 metres overall, 64 named playable crew. The ship stays huge when the camera moves."
    },
    {
      "src": "/lab/harborfolk/ironclad-human-scale.webp",
      "alt": "Close view of the helmsman on the ironclad with the named crew manifest",
      "caption": "Click a name to meet the person at their work station. People stay 1.717 metres tall."
    },
    {
      "src": "/lab/harborfolk/ironclad-engine-room.webp",
      "alt": "Engineers and stokers in the ironclad open machinery well",
      "caption": "The open machinery well makes the steam crew visible; losing those roles affects movement."
    },
    {
      "src": "/lab/harborfolk/ironclad-fleet-tactics.webp",
      "alt": "Full-size ships with wedge formation route lines and tactical command controls",
      "caption": "Attack-move, formations, stances and queued routes are saved orders for actual hulls."
    }
  ]
},
{
  "id": "the-captains-desk",
  "title": "The captain’s desk",
  "date": "2026-10-13",
  "version": "v0.3 RTS front end & original score · shipped",
  "paragraphs": [
    "The next overnight request was for Harborfolk to feel more like an RTS from the moment it opens. We now have an original illustrated harbor cover, a loading screen with actual model progress, a vertical start menu, scenario selection, new-harbor setup, options and an in-game menu. Continue returns to the saved world rather than quietly starting another settlement.",
    "The reference pass looked at Age of Empires II, StarCraft, Warcraft III, Command & Conquer and Rise of Nations. Their interfaces have different personalities, but several useful patterns recur: stable resource locations, commands that follow the selection, readable key hints, a minimap, and clear separation between starting, loading, configuring and playing. Those conventions informed the captain’s desk; their artwork and branding were not copied.",
    "The game HUD now groups timber, supplies, stone, population capacity, age and time into a compact strip. A bottom dock gives the selection an identity and keeps the six primary actions in a consistent command grid beside the coast chart. Objectives open when wanted. The centre stays available for the people, construction and huge vessels that make this project interesting.",
    "The naval battle gains a strait chart and local fleet control groups. Click the chart to move the camera, or right-click to order selected ships. Ctrl+1–4 saves a selection; 1–4 recalls its surviving ships. Those are commands for the actual existing hulls, not substitutes for their scale. The ship slider, crew duties, combat saving and WebGL2/WebGPU comparison remain intact.",
    "Menu transitions needed careful treatment. A solo world waits without changing its saved pause flag or camera. In connected co-op, browsing a menu does not pause the shared battle for the other player. The title menu also leaves an existing autosave unchanged until the player continues. Native save dialogs retain their Escape behavior, and new world starts preserve the previous recovery snapshot.",
    "There is also an original procedural nautical score: distinct menu, harbor, battle and victory phrases, layered soft synthesis, low percussion, compression and subtle reverb. It is synthesized orchestral-style music, not a recording of an orchestra. Menu music begins after a gesture, master mute is genuinely silent, and independent music/effects volumes persist. Opening the menu suppresses hidden chopping and battle-effect noise.",
    "The cover is original illustration, not a gameplay screenshot or a new promise about historical engineering. The runtime still uses the same metre dimensions. These images are actual captures of the published interface; the command-desk views show the game itself. Desktop, narrow-screen and reduced-motion layouts were checked.",
    "The shipped source passed 171 automated tests. Real browser checks covered normal boot, menu navigation, a saved-world round trip, onboarding, measured audio output and mute, loading recovery, existing editor flows and maximum-fleet co-op. That co-op check also opened the guest’s menu while the host’s simulation continued. The refreshed production UI held about 60 FPS in display-paced RTX 5090 tests at 48, 192 and 256 starting ships on both renderers; this still does not establish an uncapped performance ceiling. Family feedback on the score and controls remains the next human check."
  ],
  "sources": [
    {
      "title": "AoE II: resources and commands",
      "url": "https://www.ageofempires.com/learn-to-play/control-resources-aoe2/"
    },
    {
      "title": "StarCraft: hotkeys and control groups",
      "url": "https://classic.battle.net/scc/gs/control.shtml"
    },
    {
      "title": "Warcraft III: control conventions",
      "url": "https://classic.battle.net/war3/basics/specialcommands.shtml"
    },
    {
      "title": "C&C: menus, sidebar and saving",
      "url": "https://help.ea.com/en/articles/command-and-conquer/command-and-conquer-remastered/how-to-play/"
    },
    {
      "title": "Rise of Nations: original manual",
      "url": "https://steamcdn-a.akamaihd.net/steam/apps/287450/manuals/Manual.PDF?t=1523572459"
    }
  ],
  "images": [
    {
      "src": "/lab/harborfolk/rts-title-menu.webp",
      "alt": "Harborfolk title menu over original dawn harbor illustration with a huge sailing ship",
      "caption": "Original cover illustration, a familiar start menu, and a world that waits for Continue."
    },
    {
      "src": "/lab/harborfolk/rts-scenario-selection.webp",
      "alt": "Harborfolk scenario selection showing the naval battle and developed civilizations",
      "caption": "Choose a first harbor, a developed world or a staffed naval battle."
    },
    {
      "src": "/lab/harborfolk/rts-harbor-command-desk.webp",
      "alt": "Harborfolk village with compact resource bar, minimap, selection card and command grid",
      "caption": "The actual game: readable resources and commands around a clear playfield."
    },
    {
      "src": "/lab/harborfolk/rts-options-menu.webp",
      "alt": "Harborfolk options with independent audio sliders and keyboard control hints",
      "caption": "An original synthesized score with separate persistent music and effects gains."
    }
  ]
},
{
  "id": "a-battle-worth-coming-back-to",
  "title": "A battle worth coming back to",
  "date": "2026-10-12",
  "version": "v0.3 epic naval battle · shipped",
  "paragraphs": [
    "The Azure Strait is our first fleet-sized battle: blue and red ships, two enormous flagships, visible sailors, physical shots and actual casualties. The Fleet & FPS slider chooses 6–128 ships per side: as many as 256 hulls and 778 people at the start. It adds complete ships and people to the simulation. It does not scale them down to fit the screen.",
    "The little cutters are eight metres long. The two stylized great ships retain the existing 69-metre overall length, 11.3-metre beam, 18-metre yards and 52.4-metre keel-to-mainmast height. Every person is 1.717 metres tall. Up close, a sailor looks wonderfully small beside the hull. The large vessels use eight prototype work stations; they do not claim to reproduce the much larger historical crews or complete naval engineering.",
    "Crew jobs matter. Without a living helmsman and rower, a cutter cannot move; without its gunner, it cannot fire. On a flagship, helm and sail handling permit movement, the two gun stations fire, the lookout extends range, the rigger improves speed, the carpenter repairs a living hull and the quartermaster improves reloading. Shots lead a moving target but must still physically reach it. Sinking leaves living survivors afloat, and repairs never bring back lost people.",
    "Parent and child can command the same blue fleet through Co-op. A two-process browser test connected the maximum fleet, issued a guest order through a real right-click, fought, paused, and saved a named mid-battle moment. After disconnecting, the host reloaded it and created a fresh invitation. Ship positions, damage, velocities, orders, crew identities, jobs, casualties and in-flight projectiles matched exactly in the guest browser. Resumed combat then reached both players.",
    "That larger state needed a transport change: snapshots now travel in bounded ordered pieces rather than assuming one enormous WebRTC message will arrive. Saves remain local to the browser profile, with JSON export for a portable backup. The connection still supports one guest with manual invitation and answer exchange, and there is no relay service. Those boundaries are worth understanding before planning a remote session.",
    "The battle also has an actual WebGPU renderer beside WebGL2. Switching keeps the paused combat state and camera; each player chooses their own backend. Shared instanced geometry batches small hulls, limbs and shots. The original harbor keeps its established WebGL fog pipeline, and combat AI still runs on the CPU. The counter reports measured browser FPS, frame milliseconds and draw calls, and identifies a fallback honestly.",
    "On Fort’s RTX 5090, production browser runs at 1440 × 900 held approximately 60 FPS with 48, 192 and 256 starting ships on both real hardware backends. The runs included moving ships, shots and casualties after warm-up. They were display-paced near 60 FPS, so they do not establish a throughput ceiling or a WebGPU speed advantage. Performance on the child’s computer is still a family playtest question.",
    "The shipped build passed 169 automated tests, the maximum-fleet co-op save/resume round trip, backend-switch preservation and the existing eight save/editor browser checks. These images are captures of the public game. The earlier loading complaint resolved when Chrome was restarted; that human result does not establish a technical root cause. Naval headset rendering remains future work, while harbor scenarios retain the existing tabletop prototype."
  ],
  "sources": [
    {
      "title": "Three.js WebGPU renderer guide",
      "url": "https://threejs.org/manual/pages/webgpurenderer.html"
    },
    {
      "title": "Three.js instanced geometry",
      "url": "https://threejs.org/docs/pages/InstancedMesh.html"
    }
  ],
  "images": [
    {
      "src": "/lab/harborfolk/naval-fleet-laboratory.webp",
      "alt": "Harborfolk naval fleet slider set to 128 ships per side with a real WebGPU FPS counter",
      "caption": "Up to 256 starting ships and 778 crew. Combat changes the live counts; the hulls keep their metre dimensions."
    },
    {
      "src": "/lab/harborfolk/naval-flagship-people.webp",
      "alt": "Small sailors at their stations on a huge full-scale Harborfolk flagship",
      "caption": "A 1.717-metre person on a 69-metre overall ship. Eight prototype jobs are visible and functional."
    },
    {
      "src": "/lab/harborfolk/naval-shared-resumed-battle.webp",
      "alt": "The guest browser showing a restored naval battle with surviving ships and crews",
      "caption": "A named save restores the actual combat roster through a fresh multiplayer invitation."
    }
  ]
},
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
