// ── Site-wide data ──────────────────────────────────────────────────────────
// One file, one source of truth. Pages import from here.

export type Repo = {
  slug: string;
  name: string;
  tagline: string;
  category: "Games" | "Unreal Engine" | "Godot × Vision Pro" | "visionOS & Spatial" | "AI & Agents" | "Tools";
  org?: string; // GitHub org/owner — defaults to "ibrews" when omitted
  stars: number; // baked fallback — live count fetched client-side
  language: string;
  story: string;
  highlights: string[];
  links: { label: string; url: string }[];
  github: string;
  wiki?: string;
  video?: string; // primary / featured YouTube id
  videos?: { id: string; title: string }[]; // additional updates, newest first
  devlog?: { url: string; teaser: string }; // link to a dedicated devlog subpage
};

export const repos: Repo[] = [
  {
    slug: "blueprint-auto-layout",
    name: "Blueprint Auto Layout",
    tagline: "Pin-aware auto-layout for Unreal Blueprint graphs. Or as it should be called: ANTI-PASTA.",
    category: "Unreal Engine",
    stars: 28,
    language: "C++",
    story:
      "Blueprint spaghetti is a rite of passage — and a productivity tax. This plugin rearranges any Blueprint graph into a readable left-to-right execution flow with one keystroke (Ctrl/Cmd+Shift+L). Under the hood it's a real layered-graph engine implemented from the published papers (Sugiyama et al.; Brandes & Köpf), not a naive tree walk — so cross-row connections, multi-consumer data pins, and long edges all route cleanly.",
    highlights: [
      "Pin-aware Brandes-Köpf coordinate assignment — the white execution spine reads as one clean horizontal line",
      "Long edges are knot-routed through reserved lanes instead of snaking across the graph",
      "Auto-grouping into named, keyword-colored comment boxes",
      "No node ever lands on top of another — columns reserve width, rows reserve height",
      "Standalone, unit-tested layout core. UE 5.7+",
    ],
    links: [],
    github: "https://github.com/ibrews/blueprint-auto-layout",
    wiki: "https://github.com/ibrews/blueprint-auto-layout/wiki",
  },
  {
    slug: "ue5-mcp",
    name: "ue5-mcp",
    tagline: "A field manual for AI agents driving Unreal Engine 5 through MCP.",
    category: "AI & Agents",
    stars: 25,
    language: "Markdown / Skill",
    story:
      "When an AI agent connects to the UE5 editor through an MCP server, it can manipulate Blueprints, materials, Niagara, MetaSounds, levels — anything UE's reflection surface exposes. But UE is full of undocumented quirks: APIs that silently no-op, crash patterns that only surface at runtime, render paths that compile cleanly and draw nothing. This skill gives your AI that scar tissue upfront, so it doesn't rediscover it every session. Server-agnostic — works with Epic's official MCP plugin (UE 5.8) or any custom server.",
    highlights: [
      "UE5 reflection gotchas — PascalCase silent no-ops, `_C` class suffixes, async asset traps",
      "Crash patterns: referenced-mesh deletion, MetaSound pin exactness, save-before-PIE",
      "The Python ↔ MCP data channel workaround (Actor Tags as a return path)",
      "Patterns for MCP server authors: schema-in-error, verify-after-mutate, continuation tokens",
    ],
    links: [],
    github: "https://github.com/ibrews/ue5-mcp",
    wiki: "https://github.com/ibrews/ue5-mcp/wiki",
  },
  {
    slug: "claude-fleet",
    name: "Claude Fleet",
    tagline: "Coordinate a fleet of computers running Claude Code through git-based messaging.",
    category: "AI & Agents",
    stars: 17,
    language: "JavaScript",
    story:
      "What happens when one AI session isn't enough? Claude Fleet coordinates multiple machines — macOS, Windows, Linux — each running Claude Code, communicating asynchronously through git, with phone access to every session for human-in-the-loop control. Includes Fleet Commander, an interactive browser game that teaches the system by playing it.",
    highlights: [
      "Git-based inbox/trigger messaging between machines — no central server",
      "Tailscale mesh networking across the whole fleet",
      "Telegram notifications wired to every session",
      "Fleet Commander: learn the architecture as a browser game",
    ],
    links: [],
    github: "https://github.com/ibrews/claude-fleet",
    wiki: "https://github.com/ibrews/claude-fleet/wiki",
  },
  {
    slug: "godot-avp-cascade",
    name: "Cascade Countdown",
    tagline: "A hand-tracked physics arcade game for Apple Vision Pro, built on Godot. Live on TestFlight.",
    category: "Games",
    stars: 7,
    language: "GDScript",
    story:
      "Emissive cubes cascade through spinning bumpers and a prism splitter onto tilted catch plates in your immersive space. Reach in and pinch to grab and throw. Every collision is a synthesized chime pitch-snapped to the key, so the chaos harmonizes into a tune. Built on Apple's official upstream visionOS contribution to Godot — a device smoke test on real Vision Pro hardware measured a locked 90 FPS across 23 measurement windows, with continuous physics racking up hundreds of collisions per run. Getting there took 8 TestFlight builds: a rejected privacy manifest with unsubstituted template variables, a near plane nudged down to Apple's 0.1 minimum, and a grab bug that looked like a left/right-hand asymmetry but was really several stacked issues plus noisy hand-tracking input — collapsed into a single THUMB-only grab-by-point with sticky release. The project also produced a reusable build-switcher script that flips a Godot visionOS project between device and simulator builds from one command, later adopted by other visionOS projects on the fleet.",
    highlights: [
      "Locked 90 FPS immersive-mode physics on real AVP hardware, measured across 23 test windows",
      "Pinch-to-grab-and-throw, collapsed from a buggy left/right asymmetry into one THUMB-only grab-by-point",
      "Procedural soundtrack — collisions synthesize chimes in key",
      "8 TestFlight builds — including one rejection fixed by patching an unsubstituted privacy-manifest template",
      "Reusable device/simulator build-switcher script, later adopted by other visionOS projects",
      "Beginner-friendly ELI5 wiki walking through how it was all built",
    ],
    links: [{ label: "TestFlight beta", url: "https://testflight.apple.com/join/bw1aeExJ" }],
    github: "https://github.com/ibrews/godot-avp-cascade",
    wiki: "https://github.com/ibrews/godot-avp-cascade/wiki",
  },
  {
    slug: "godot-visionos-simulator-kit",
    name: "Godot visionOS Simulator Kit",
    tagline: "Develop & test Godot visionOS apps in the Simulator — input, hand-tracking, one-command build switching.",
    category: "Godot × Vision Pro",
    stars: 4,
    language: "Swift",
    story:
      "A Godot visionOS app renders an immersive custom-Metal CompositorServices scene — which means the visionOS Simulator's built-in pinch simulation can't reach it. Out of the box you get zero input and zero hands in the sim, forcing a physical-device round-trip for every change. This kit closes the gap: simulated input over UDP, a SwiftUI control panel, canned hand feeds, and an engine module for real articulated MediaPipe hands.",
    highlights: [
      "One command builds + runs in Simulator or on device — signing and install differences hidden",
      "UDP input injection keeps the Simulator focused while actions reach the app",
      "Webcam → MediaPipe → Godot XRHandTracker articulated hands in the sim",
      "Extracted from the Cascade Countdown pilot — drops into any Godot visionOS repo",
    ],
    links: [],
    github: "https://github.com/ibrews/godot-visionos-simulator-kit",
    wiki: "https://github.com/ibrews/godot-visionos-simulator-kit/wiki",
  },
  {
    slug: "MetaHumanGodot",
    name: "MetaHuman → Godot",
    tagline: "MetaHuman characters in stock Godot — look-dev sliders, full-body animation, and a stereo VR preview build.",
    category: "Godot × Vision Pro",
    stars: 6,
    language: "GDScript",
    story:
      "MetaHumans rendered in stock Godot 4.6/4.7 Forward+ — no engine fork, no custom build. Started as a look-dev turntable (dial in skin, lighting, hair, eyes with live sliders; drive all 52 ARKit facial blendshapes), now a full character viewer: v0.3.0 added a retargeted Mixamo motion library with planted feet; v0.4.0 landed pore detail, a grounded studio floor, and limbal ring eye shaders. The VR preview (v0.1.0, Godot 4.7-beta3) puts it in stereo room-scale on Quest — walk around the character at path quality. Bring your own MetaHuman (Epic EULA respected; assets aren't redistributed).",
    highlights: [
      "Stock Godot 4.6/4.7 Forward+ — AgX, SSIL, screen-space subsurface scattering",
      "The MatMADNESS skin shader stack, fully sliderized + v0.4.0 pore and cavity detail",
      "52 ARKit facial blendshape drivers",
      "Full-body Mixamo motion library with planted feet (v0.3.0+)",
      "Stereo VR preview — room-scale on Quest via Godot 4.7-beta3 (v0.1.0)",
    ],
    links: [],
    github: "https://github.com/ibrews/MetaHumanGodot",
    video: "C6FQKW2uNXo",
    videos: [
      { id: "iRnbWTv1HkQ", title: "MetaHumans in Godot? In VR?!" },
      { id: "p0JoPJb4e84", title: "VR Depth of Field in Godot" },
    ],
    wiki: "https://github.com/ibrews/MetaHumanGodot/wiki",
  },
  {
    slug: "VitruvianGodot",
    name: "VitruvianGodot",
    tagline: "A fully CC0, EULA-free photoreal digital human in stock Godot — she speaks, she breathes, ship her anywhere.",
    category: "Godot × Vision Pro",
    stars: 1,
    language: "GDScript",
    story:
      "The free counterpart to MetaHumanGodot: a CC0 real-time digital human in stock Godot 4.6 Forward+, with no Epic MetaHuman EULA attached. v1.1 is the full demo reel: she speaks (neural TTS + envelope-driven FACS viseme sync), has 4K eyes with tearline and lacrimal caruncle AO, 4K skin with pore and cavity detail, closed hair part-line, a hero studio floor, vignette, and a liveness layer — micro-sway, asymmetric rest face, micro-expressions. Ships as a signed + notarized macOS Universal app and Windows x64. Everything can be redistributed, cloud-rendered, and shipped in closed-source commercial products.",
    highlights: [
      "100% CC0 — redistribute, cloud-render, ship commercially with no EULA",
      "She speaks: neural TTS + envelope-driven FACS viseme sync (v1.1)",
      "4K eyes: tearline, lacrimal caruncle, lid-contact AO — mesh eyeballs, not procedural",
      "4K skin: face cavity detail + body/neck atlas-baked from source EXRs",
      "Liveness layer: micro-sway, asymmetric rest face, micro-expressions",
      "macOS Universal (signed + notarized) and Windows x64 — double-click, no Gatekeeper prompt",
    ],
    links: [],
    github: "https://github.com/ibrews/VitruvianGodot",
    wiki: "https://github.com/ibrews/VitruvianGodot/wiki",
  },
  {
    slug: "SplatStage",
    name: "SplatStage",
    tagline: "Walk inside photoreal Gaussian-splat scenes on Vision Pro via visionOS 27's native splat API.",
    category: "visionOS & Spatial",
    stars: 0,
    language: "Swift",
    story:
      "Stand inside a photoreal Gaussian-splat environment on Apple Vision Pro, rendered by visionOS 27's native RealityKit GaussianSplatComponent — then light it like a film set with the new cinematic RealityKit stack: projective-texture spotlights, soft shadows, ray-traced reverb meshes. Built the day after WWDC 2026 against Xcode 27 beta 1, with the device-proven beta-1 recipe (chunking, buffer alignment, colorSpace) documented for everyone who hits the same walls.",
    highlights: [
      "visionOS 27 native GaussianSplatComponent — among the first public recipes",
      "Cinematic RealityKit lighting: projective spotlights, soft shadows, RT reverb",
      "The beta-1 gotcha list: chunking, buffer alignment, colorSpace",
      "A/B benchmark vehicle vs. custom MetalSplatter rendering",
    ],
    links: [],
    github: "https://github.com/ibrews/SplatStage",
    wiki: "https://github.com/ibrews/SplatStage/wiki",
  },
  {
    slug: "Understudy",
    name: "Understudy",
    tagline: "Multiplayer spatial theater — a Vision Pro director, iPhone performers. 'Figma for stage direction.'",
    category: "visionOS & Spatial",
    stars: 1,
    language: "Swift",
    story:
      "Understudy turns a real room into a programmable stage. A director wearing Apple Vision Pro places blocking marks on the floor — actual points in 3D space — and attaches lines, sound cues, light cues, and beats to each one. Performers hold phones that become smart teleprompters: walk onto a mark, your phone pulses, the next line appears, the cue fires. Ten classic plays are bundled — Shakespeare, Chekhov, Ibsen, Wilde — so you never type a line. As of v0.8 the same model serves film: virtual camera marks with real lens specs and FOV wedges, the phone as a literal viewfinder.",
    highlights: [
      "Vision Pro director sees performers as ghost avatars in real time",
      "Phones as smart teleprompters driven by physical position",
      "Record a blocking once — anyone can walk it back as a self-paced AR tour",
      "Film pre-viz: camera marks with 14–135mm lens FOV wedges",
      "Ten classic plays bundled, tappable line-by-line",
    ],
    links: [],
    github: "https://github.com/ibrews/Understudy",
    wiki: "https://github.com/ibrews/Understudy/wiki",
  },
  {
    slug: "holodeck-pocket",
    name: "Holodeck-in-a-Pocket",
    tagline: "Scan a QR code mid-talk, walk through a virtual venue on your phone. No install.",
    category: "visionOS & Spatial",
    stars: 0,
    language: "TypeScript",
    story:
      "A WebXR demo built for FMX 2026 and NXT BLD 2026: an audience member points their phone at a QR code during the talk and is immediately walking through a virtual venue — Four Seasons Lake Austin, a Christmas Carol stage, more. Three pre-built scenes share one Babylon.js engine, and each exposes live design-option toggles (lighting, layout, materials) — which is the whole productization punchline.",
    highlights: [
      "Zero install — QR code straight to walkable WebXR",
      "Babylon.js + TypeScript + Vite, deployed to GitHub Pages",
      "Live design toggles per scene: lighting, layout, materials",
      "Built as a conference demo that became a product thesis",
    ],
    links: [{ label: "Live demo", url: "https://ibrews.github.io/holodeck-pocket/" }],
    github: "https://github.com/ibrews/holodeck-pocket",
    wiki: "https://github.com/ibrews/holodeck-pocket/wiki",
  },
  {
    slug: "spatial-deck",
    name: "Spatial Deck",
    tagline: "The presentation framework for people who think spatially. One HTML file, runs anywhere, forever.",
    category: "Tools",
    stars: 3,
    language: "HTML",
    story:
      "Built for the HarvardXR 2026 closing keynote, when PowerPoint wasn't going to cut it. A single self-contained HTML file with presenter tooling PowerPoint never gave you: animated canvas media galleries, Web Audio sound design, live annotation and element repositioning mid-presentation, and — critically — a format an AI collaborator can edit with you right up until showtime. The Harvard keynote was a hit; the framework that powered it became Spatial Deck.",
    highlights: [
      "One HTML file — no cloud, no build process, no lock-in",
      "Annotation + move modes designed for AI-collaborative editing",
      "Canvas media galleries, Web Audio, pixelated reveal effects",
      "Hands back a pixel-faithful PDF when someone asks for 'the deck'",
    ],
    links: [{ label: "The Harvard keynote it powered", url: "https://ibrews.github.io/harvardxr-keynote/" }],
    github: "https://github.com/ibrews/spatial-deck",
    wiki: "https://github.com/ibrews/spatial-deck/wiki",
  },
  {
    slug: "ue5-testflight",
    name: "ue5-testflight",
    tagline: "Fully autonomous UE5 → TestFlight pipeline for iOS, visionOS, and macOS. One command.",
    category: "Unreal Engine",
    stars: 4,
    language: "Shell",
    story:
      "One command triggers build → sign → upload → distribute. Thirty to sixty minutes later your Unreal build is live in TestFlight with internal and external groups notified. Cook and stage via RunUAT, Info.plist patching, auto-incrementing build numbers with no gaps — every manual step of the Apple distribution dance, automated.",
    highlights: [
      "iOS, visionOS, and macOS targets from the same pipeline",
      "Auto-increment CFBundleVersion tracked in a file — no collisions, no gaps",
      "Privacy strings and bundle ID patched automatically",
      "Designed to run unattended via launchd — overnight builds that ship themselves",
    ],
    links: [],
    github: "https://github.com/ibrews/ue5-testflight",
    wiki: "https://github.com/ibrews/ue5-testflight/wiki",
  },
  {
    slug: "unreal-mac-getstats-fix",
    name: "unreal-mac-getstats-fix",
    tagline: "Runtime fix for the UE editor crash-on-launch on macOS 26 Tahoe. No source rebuild.",
    category: "Unreal Engine",
    stars: 2,
    language: "C / dylib",
    story:
      "UE 5.6.1, 5.7, and 5.8 crash on every launch on macOS 26 (Tahoe) — a stack-buffer-overflow in FMacPlatformMemory::GetStats before the editor window even appears. The official fix is 'rebuild the engine from source.' This is the other fix: a 30-line DYLD_INSERT_LIBRARIES shim that patches the problem at runtime. Install, launch, work.",
    highlights: [
      "Fixes UE 5.6.1 / 5.7 / 5.8 on macOS 26 without rebuilding the engine",
      "30-line dylib shim — auditable in one screenful",
      "Saved countless Mac Unreal devs from a multi-hour source build",
    ],
    links: [],
    github: "https://github.com/ibrews/unreal-mac-getstats-fix",
    wiki: "https://github.com/ibrews/unreal-mac-getstats-fix/wiki",
  },
  {
    slug: "apple-platform-skills",
    name: "apple-platform-skills",
    tagline: "Claude Code skills for Apple platform development — visionOS SharePlay, SpriteKit, GameKit.",
    category: "AI & Agents",
    stars: 2,
    language: "Markdown / Skill",
    story:
      "Install once (`npx skills add ibrews/apple-platform-skills`) and your AI assistant knows the traps before it falls in them: the GroupSession `session.join()` trap, spatial Persona lifecycle, SpriteKit's physics bitmask UInt32 overflow, GameKit multiplayer handshakes. Written from real shipped-app scar tissue, not docs paraphrase.",
    highlights: [
      "visionos-shareplay: GroupActivities, spatial Personas, ImmersiveSpace integration",
      "spritekit-ios: coordinate systems, bitmask traps, texture atlases, game-loop discipline",
      "GameKit multiplayer patterns that actually survive review",
    ],
    links: [],
    github: "https://github.com/ibrews/apple-platform-skills",
    wiki: "https://github.com/ibrews/apple-platform-skills/wiki",
  },
  {
    slug: "gh-social-upload",
    name: "gh-social-upload",
    tagline: "Upload a repo's social preview card from the CLI — the API GitHub never gave you.",
    category: "Tools",
    stars: 0,
    language: "JavaScript",
    story:
      "GitHub has no public API for setting a repository's social preview image — the OpenGraph card shown when your repo is shared on X, Slack, or Discord. The web UI is the only way. This tool drives that UI with Playwright and a saved browser session, so `gh social-upload --image social.png` just works — and your repo-publishing automation can finally be fully automated.",
    highlights: [
      "One-liner: gh social-upload --image social.png",
      "Auto-detects the repo from your working directory",
      "Runs as a gh extension or npm CLI",
      "Solves a gap GitHub has acknowledged but never filled",
    ],
    links: [],
    github: "https://github.com/ibrews/gh-social-upload",
    wiki: "https://github.com/ibrews/gh-social-upload/wiki",
  },
  {
    slug: "gh-wiki-init",
    name: "gh-wiki-init",
    tagline: "Enable + initialize a GitHub repo's wiki from the terminal — including the impossible first page.",
    category: "Tools",
    stars: 0,
    language: "JavaScript",
    story:
      "Spinning up a repo wiki from a script is weirdly hard: the wiki git repo doesn't exist until a first page is created, and there is no REST or GraphQL API to create one. (The 'just git push to init it' trick is a myth.) gh-wiki-init does the one unavoidable UI step via a saved browser session, then everything else over plain git. The wiki sibling of gh-social-upload.",
    highlights: [
      "gh wiki-init OWNER/REPO ./pages — enable, create first page, push",
      "Documents the undocumented: why wiki automation fails for everyone",
      "Plain git after the first page — no magic left behind",
    ],
    links: [],
    github: "https://github.com/ibrews/gh-wiki-init",
    wiki: "https://github.com/ibrews/gh-wiki-init/wiki",
  },
  {
    slug: "swing-city",
    name: "Swing City",
    tagline: "A rain-soaked neon city you can swing across, Spider-Man style — now with multiplayer joust rules.",
    category: "Games",
    stars: 0,
    language: "JavaScript",
    story:
      "A low-poly Blade Runner grid, procedurally generated from a single seed — streets, traffic-light-obeying cars, rain, neon towers — built first as a Blender/Python generator, then ported line-for-line into a self-contained Three.js browser game. Web-swing between skyscrapers, knock cars flying, climb buildings, chain combos, and dodge a zombie wave or two. One July 2026 session ran 13 rounds of real-hardware VR playtesting back to back — ship a batch, play it on the headset, get bug reports, ship the next batch. The hardest of those bugs was a right-stick calibration that got re-specified 10 times before a hardware-confirmed fix finally stuck (\"LOCK THAT\"), and a separate VR avatar-invisible bug that root-caused to a one-line three.js gotcha: Object3D.lookAt() orients +Z for everything except cameras, so the follow-rig was facing 180° away from the player every frame. Multiplayer runs on a from-scratch Cloudflare Worker + Durable Object relay: zero server-side physics, an \"attacker computes, server relays, victim applies\" message convention reused across every player-vs-player mechanic, and the WebSocket Hibernation API so a room full of idle sockets never pins memory.",
    highlights: [
      "Procedural city — same seed, same layout, in both Blender and the browser",
      "Full physics: web-swinging, wall-crawling, car knockback with momentum-scaled combos",
      "Opt-in multiplayer — joust rules, random color per player, colored webs, knock players (and cars) around, land on a head to explode them",
      "13 rounds of real-hardware VR playtesting in one session — the right-stick calibration alone took 10 of them to lock",
      "VR avatar-invisible bug root-caused to a one-line three.js axis-convention gotcha (Object3D.lookAt())",
      "Multiplayer relay built from scratch on Cloudflare Workers + Durable Objects, later extracted into a reusable pattern doc",
    ],
    links: [
      { label: "Play — single player", url: "https://ibrews.github.io/swing-city/" },
      { label: "Play — multiplayer", url: "https://ibrews.github.io/swing-city/?mp=wss%3A%2F%2Fswing-city-multiplayer.alexcoulombe.workers.dev%2Fws" },
    ],
    github: "https://github.com/ibrews/swing-city",
    wiki: "https://github.com/ibrews/swing-city/wiki",
    devlog: {
      url: "/repos/swing-city/devlog",
      teaser:
        "From a Blender script to a browser game with real physics, WebXR, and multiplayer — plus the bugs that got found along the way.",
    },
  },
  {
    slug: "crystal-caper",
    name: "Crystal Caper",
    tagline: "A pixel-art platformer where 100% of the art is AI-generated. Playable in your browser.",
    category: "Games",
    stars: 0,
    language: "Swift",
    story:
      "A complete platformer built from a single prompt — \"a full game with generated assets\" — with every sprite, animation, and tile generated on demand through the PixelLab MCP, none of it hand-drawn or licensed. Pip the fox runs, jumps, and stomps mushrooms across endless procedurally-generated levels cycling through forest, snow, and desert biomes, with a crowned boss, King Grumpcap, capping every 5th level. The whole build chain ran with no human in the loop for the core loop: PixelLab generated the character, enemy, and tileset art from roughly 7 of a 20-generation trial budget, SpriteKit assembled it into a physics-driven platformer with camera follow and parallax, an in-headless autopilot self-test caught a real level bug before a human ever touched a controller, and the same procedural level generator got ported line-for-line to a web build so the HTML5/Canvas version plays identically to the iOS original. Even the boss is a deliberately hand-coded placeholder — kept that way on purpose to conserve the PixelLab generation budget for the assets that mattered more.",
    highlights: [
      "100% AI-generated art and animation via the PixelLab MCP — character, enemy, and tileset, none hand-drawn",
      "Procedurally-generated endless levels across 3 biomes, ported line-for-line from Swift to a matching web build",
      "Autopilot self-test plays the game headlessly and caught a real level bug pre-launch",
      "A crowned, armored boss — King Grumpcap — gates every 5th level with a 3-hit telegraph/charge/recover pattern",
      "Shared online leaderboard on a Cloudflare Worker + KV, verified end-to-end before ever touching a live account",
    ],
    links: [{ label: "Play in browser", url: "https://ibrews.github.io/crystal-caper/" }],
    github: "https://github.com/ibrews/crystal-caper",
  },
  {
    slug: "TankCommanderVR",
    name: "Tank Commander",
    tagline: "A VR tank game for Meta Quest 3 with a physically-operated cockpit. Made for Ani.",
    category: "Games",
    stars: 0,
    language: "GDScript",
    story:
      "Sit inside a one-man turret and physically operate it: flip the battery master, hold the starter until the engine catches, grab twin tillers to drive the tracks, work the turret joystick, cycle the breech lever to reload, arm the rocket console behind its safety cover. Every texture, sound, and voice line is procedurally generated — nothing imported — and every piece of geometry, cockpit included, is built at runtime in pure GDScript rather than loaded from a scene file. The physical cockpit controls were fully built and unit-tested from day one, and never actually worked in the headset for most of the project's life: the hand-proximity code read from a Godot group that, per a full git history search, no control had ever actually joined. Root-caused and fixed in the same session as an even bigger discovery — roughly 70% of the game's geometry had inverted face normals from the very first commit, because the custom mesh-building helper wound triangles counter-clockwise, the OpenGL convention, when Godot's front faces are clockwise. Alex caught it live in the headset before any tool did: \"I conservatively estimate about 70% of the normals are inverted. You need to trust me on this — I have depth perception.\" He was right, proven with a one-triangle test scene, not documentation. The team's own automated mesh-audit tool shared the same wrong assumption and had been validating broken geometry the whole time.",
    highlights: [
      "Physically-operated cockpit — real grab/poke levers, tillers, and a covered rocket switch, not button mapping",
      "100% procedural — textures, sounds, and 200+ voice lines generated, zero imported art assets",
      "A controls system that was fully built, unit-tested, and silently never wired to the input rig for most of development",
      "~70% of the game's geometry had inverted normals from commit one — caught in headset, confirmed with a custom test scene",
      "10 battlefields, 5 vehicles, on-foot mode, and LAN co-op with fully procedural Rec-Room-style avatars",
    ],
    links: [],
    github: "https://github.com/ibrews/TankCommanderVR",
  },
  {
    slug: "NeonSerpent",
    name: "Neon Serpent",
    tagline: "A cyberpunk Snake game built by a father-son team — the son is 10 — with a full 3D Vision Pro mode.",
    category: "Games",
    stars: 1,
    language: "Swift",
    story:
      "Snake, reimagined as a neon synthwave grid: swipe to steer on iPhone/iPad, collect data orbs and neon bugs, unlock 14 skins through score milestones and trophy challenges — fire trails, rainbow cycling, circuit-board lines. The Vision Pro version is a genuinely different game: a full 3D snake living inside an 8×8×8 cube with six degrees of freedom, either shrunk to a tabletop volumetric puzzle or blown up to room-scale, where the snake winds through your actual living room and a game controller gives you precise 6-axis steering.",
    highlights: [
      "Built by a father-son team — the son is 10",
      "iOS: SpriteKit, swipe controls, 14 unlockable skins with unique effects",
      "visionOS: full 3D snake in an 8×8×8 cube, 6 degrees of freedom",
      "Volumetric tabletop mode and room-scale mixed-reality mode, same game",
      "PlayStation controller support for precise 6-axis steering in VR",
    ],
    links: [],
    github: "https://github.com/ibrews/NeonSerpent",
  },
  {
    slug: "BurgerBandit",
    name: "BurgerBandit",
    tagline: "A fast-food heist game designed by an 8-year-old — the more you steal, the fatter and slower you get.",
    category: "Games",
    stars: 0,
    language: "Swift",
    story:
      "Play a masked burglar breaking into four parody fast-food joints — Burger Barn, Queen Burger, Freckle's, Papa Rooster's — to steal as much food as you can carry while guards patrol and give chase. The core joke is also the core mechanic: finished food scores more than raw ingredients but fattens you up faster, and fatness is real physics — four visual stages, a growing collision radius, and a speed drop from sprint to waddle, until the final stage starts an 8-second countdown to get out before you're arrested. Rare veggie pickups heal and speed you up, which the burglar resents every time.",
    highlights: [
      "Designed by an 8-year-old, built in pure SpriteKit — no dependencies",
      "Four parody restaurants, each with its own layout, security team, and tagline",
      "Fat physics: 4 visual growth stages, bigger collision radius, speed drops to a waddle",
      "Final fat stage starts an 8-second escape timer before you're arrested",
      "3 difficulty levels; veggie pickups heal and boost speed (reluctantly)",
    ],
    links: [],
    github: "https://github.com/ibrews/BurgerBandit",
  },
  {
    slug: "spellrot-ue",
    name: "Spellrot",
    tagline: "A wizard-vs-zombie-horde arena brawler where every hit corrupts your spells — and edges you closer to becoming a zombie yourself.",
    category: "Games",
    stars: 0,
    language: "C++",
    story:
      "The last living wizard holds back endless zombie waves in this UE5.7 prototype. Every hit you take raises a corruption meter — your spells get stronger as it climbs, but at 1.0 you ragdoll and the level restarts. A capture-zone-style cleanse resets it to zero; a line-trace fireball kills enemies and claws corruption back down; a Niagara trail shifts from its base color to magenta in real time as a visual countdown to transformation. Built with Claude Code Game Studios, a sister framework that turns a single Claude Code session into a 49-agent, 73-skill studio — directors, department leads, specialists — so the prototype got design docs and QA passes instead of ad hoc vibe-coding.",
    highlights: [
      "Corruption mechanic: +0.25 per hit taken, ragdoll and restart at 1.0",
      "Cleanse zone resets corruption to zero; fireball kills claw it back by 0.1",
      "Niagara trail shifts color in real time as a visual corruption countdown",
      "Built on UE5.7 Third Person Template + the ECABridge MCP plugin",
      "Production framework: 49 AI agents, 73 skills, one coordinated Claude Code studio",
    ],
    links: [{ label: "The 49-agent studio that built it", url: "https://github.com/ibrews/spellrot" }],
    github: "https://github.com/ibrews/spellrot-ue",
  },
  {
    slug: "ue-openxr-passthrough",
    name: "UE OpenXR Passthrough",
    tagline: "PCVR passthrough for Unreal via raw OpenXR — no 500MB Meta XR Plugin required.",
    category: "Unreal Engine",
    org: "agilelens",
    stars: 2,
    language: "C++",
    story:
      "The official way to get Meta Quest passthrough working over Quest Link/Air Link in Unreal is the Meta XR Plugin — a ~500MB dependency that drags a lot of Meta-specific code into a project. This is the ~500-line alternative: it registers as an IOpenXRExtensionPlugin so UE's OpenXR runtime picks it up automatically, requests XR_FB_passthrough directly, and auto-detects PCVR vs. standalone by checking which blend modes the runtime actually supports — doing real work only on PCVR (flipping UE's alpha-inversion CVars so the compositor's underlay renders correctly) and quietly doing nothing on standalone Quest, where the engine-native path already handles it.",
    highlights: [
      "No Meta XR Plugin dependency — ~500 lines vs. a ~500MB SDK",
      "Registers as an IOpenXRExtensionPlugin — UE's OpenXR runtime picks it up automatically",
      "Auto-detects PCVR vs. standalone by blend mode, only acts where it's needed",
      "Flips UE's alpha-inversion CVars so passthrough composites correctly through Quest Link",
      "Runtime toggle via SetPassthroughEnabled(bool); Win64-only, auto-skipped elsewhere",
    ],
    links: [],
    github: "https://github.com/agilelens/ue-openxr-passthrough",
  },
  {
    slug: "UE5_AndroidXR",
    name: "UE5 AndroidXR Template",
    tagline: "A pre-configured UE5 VR Template for Android XR — package straight to a Galaxy XR headset.",
    category: "Unreal Engine",
    org: "agilelens",
    stars: 13,
    language: "Makefile",
    story:
      "Epic's stock VR Template doesn't know Android XR exists. This fork does the SDK/NDK/manifest wiring by hand — minimum and target SDK 32, NDK 25.1.8937393, JDK 17 — and bundles the AndroidXR plugin (started by Owlchemy Labs, now maintained by Agile Lens) so a Galaxy XR build is Platforms → Android → Android_ASTC → Package Project, not a week of trial-and-error. Passthrough is wired through OpenXR project settings out of the box, so mixed reality works the moment the APK lands on the headset.",
    highlights: [
      "Stock UE5 VR Template, pre-configured for Android XR from a clean checkout",
      "AndroidXR plugin bundled — started by Owlchemy Labs, now maintained by Agile Lens",
      "SDK/NDK/manifest settings done for you: SDK 32, NDK 25.1.8937393, JDK 17",
      "Passthrough enabled via OpenXR project settings for mixed reality out of the box",
      "Packages straight to Samsung Galaxy XR",
    ],
    links: [],
    github: "https://github.com/agilelens/UE5_AndroidXR",
  },
  {
    slug: "mandelbulb-xr",
    name: "mandelbulb-xr",
    tagline: "A living, ever-mutating Mandelbulb fractal — one GLSL core, running everywhere from Shadertoy to a Vision Pro streamed over CloudXR.",
    category: "visionOS & Spatial",
    stars: 1,
    language: "GLSL",
    story:
      "Most animated Mandelbulbs ping-pong their 'power' parameter on a single sine wave, so the shape visibly reverses and repeats. This one wanders quasi-periodically across two incommensurate sines instead, so it morphs organically and never obviously loops. One canonical GLSL core drives four variants — paste-and-go Shadertoy, a WebGL2 build that runs in any browser or WebXR headset, a LÖVR build you can walk around on Quest standalone, and an OpenXR/D3D11 port (a line-for-line HLSL translation of the same core) for SteamVR, WMR, or CloudXR streaming straight to Apple Vision Pro.",
    highlights: [
      "Power parameter wanders across two incommensurate sines — never obviously repeats",
      "One canonical GLSL core, four variants: Shadertoy, WebGL2/WebXR, LÖVR, OpenXR/D3D11",
      "D3D11 variant is a line-for-line HLSL port of the same shared core",
      "CloudXR streaming variant reaches Apple Vision Pro from a PC render",
      "Live in the browser, zero install — drag to orbit",
    ],
    links: [{ label: "Try it live", url: "https://ibrews.github.io/mandelbulb-xr/" }],
    github: "https://github.com/ibrews/mandelbulb-xr",
  },
  {
    slug: "claude-session-recovery",
    name: "Claude Code Session Recovery",
    tagline: "Rebuilds Claude Desktop's session index after a crash — your conversations were never actually gone.",
    category: "AI & Agents",
    stars: 0,
    language: "Python",
    story:
      "Claude Code stores every session as a JSONL file on disk, but Claude Desktop keeps a separate index of what to show in its sidebar — and that index is exactly the thing that corrupts after a BSOD, hard shutdown, or disk error, making sessions vanish from the UI while the underlying data sits untouched. This tool just rebuilds the index: list every session on disk with a ready-to-run `claude --resume` command, dry-run a restore to see what's actually missing, then restore it for real. Pure Python stdlib, no dependencies, works the same on Windows, macOS, and Linux.",
    highlights: [
      "Fixes the actual bug: Desktop's session INDEX corrupts, not the session data itself",
      "`list` — every on-disk session with a ready-to-run claude --resume command",
      "`restore --dry-run` — see exactly what's missing before touching anything",
      "`export` — plain-text transcripts for full-text search or archival",
      "Python 3.8+, stdlib only, zero external dependencies",
    ],
    links: [],
    github: "https://github.com/ibrews/claude-session-recovery",
  },
  {
    slug: "claude-usage-audit",
    name: "usage-audit",
    tagline: "Mines your past Claude Code sessions for what you should actually automate next — evidence, not guesses.",
    category: "AI & Agents",
    stars: 1,
    language: "HTML",
    story:
      "Instead of guessing which workflows deserve a skill or a script, this reflects on the sessions already run: repeated manual work, recurring friction, anything with a stable enough shape to script. It doesn't implement anything — it hands back a ranked, evidence-backed list and you decide what's worth building. The one hard constraint baked into the design: mining a month of transcripts is a job for a cheap model, not a frontier one, so four narrow-scope subagents on Haiku/Sonnet-tier models do the raw digging, and only the final clustering-and-ranking pass touches the main session's model.",
    highlights: [
      "Reflects on past sessions instead of guessing what to automate",
      "Hands back a ranked, evidence-backed list — doesn't implement anything itself",
      "Four narrow-scope Haiku/Sonnet subagents do the digging; frontier model only ranks",
      "Install via git clone into ~/.claude/skills/usage-audit, or copy SKILL.md directly",
      "Scriptable to run monthly as a standing self-audit",
    ],
    links: [],
    github: "https://github.com/ibrews/claude-usage-audit",
  },
];

// ── Lab (upcoming products) ─────────────────────────────────────────────────

export type Product = {
  slug: string;
  name: string;
  status: string;
  tagline: string;
  pitch: string;
  sections: { heading: string; body: string }[];
  bullets: string[];
  links: { label: string; url: string }[];
  accent: string; // tailwind-friendly hue token
  video?: string; // primary / featured YouTube id
  videos?: { id: string; title: string }[]; // additional updates, newest first
};

export const products: Product[] = [
  {
    slug: "forage",
    name: "Forage",
    status: "Private beta — wishlist open",
    tagline: "Fab's best friend. An AI-first scout and installer for the Unreal Engine packs you already own.",
    pitch:
      "You've bought hundreds of asset packs over years of Fab and Marketplace sales — and you can't remember what's in any of them. Forage takes a creative intent like \"amazing castle with horses running around the gates\" and matches it against your owned library: the 2–3 best-fit packs, the hero assets inside them, and which project versions are dead weight you can prune. Then it installs them.",
    sections: [
      {
        heading: "Built for the AI-build-agent era",
        body: "Forage ships its own MCP server — run `forage mcp` and your AI agent can query your owned library directly, no copy-paste. It also returns structured JSON designed to hand straight to any build agent: 'You already own Medieval Castle Walls Pro; hero asset is SM_CastleGate; the UE 5.5 artifact is the one you want.' Your agent builds; Forage scouts.",
      },
      {
        heading: "Find it, then get it",
        body: "Forage doesn't stop at telling you what to grab — it installs it. Once you've picked a pack, Forage drives the install inside the Unreal editor: it navigates the Fab pane, sets everything up, and hands you the one click that matters. Or dial it all the way to hands-free. You set the level; Forage does the rest.",
      },
      {
        heading: "Your entire library, one local database",
        body: "Run `forage refresh-library` once: Forage walks your entire Fab-owned catalog, pulls every pack, and stores it locally in SQLite — titles, categories, descriptions, project versions, bloat estimates, all of it. Every search after that is instant, offline, and completely private. The What's New feed tells you what changed since last time: new packs in your library, wishlist items that just landed, packs with updates.",
      },
      {
        heading: "A wishlist without the cap",
        body: "Fab caps your wishlist around 150 items. Forage keeps an unlimited local one — and alerts you the moment a wishlisted pack lands in your owned library. `forage ui` opens a local browser dashboard for searching your library and managing the wishlist without touching the CLI.",
      },
      {
        heading: "More on the way",
        body: "A Chrome extension is in development: owned and wishlisted badges that appear directly on fab.com as you browse, so you never accidentally buy something you already have. Multi-engine support is planned — groundwork is already in for Unity and Godot alongside Unreal. Megascans and Cosmos integration is on the roadmap.",
      },
      {
        heading: "Not a marketplace, not a generator",
        body: "Forage doesn't sell assets and doesn't synthesize them. It's a really good scout and installer for the packs you already paid for — which it turns out is the thing everyone actually needed.",
      },
    ],
    bullets: [
      "Creative intent in, 2–3 best-fit owned packs out",
      "MCP server + structured JSON handoff to any AI build agent",
      "Guided install — from open-it-and-you-click to hands-free, your choice",
      "Unlimited local wishlist with What's New alerts",
      "Bloat report: spot the dead project versions in every pack",
      "Local web UI (`forage ui`) — library search + wishlist, no CLI needed",
      "Chrome extension coming: owned + wishlisted badges on fab.com",
    ],
    links: [{ label: "Landing page + wishlist", url: "https://ibrews.github.io/forage-site/" }],
    video: "oQf8w26a36M",
    accent: "amber",
  },
  {
    slug: "project-ion",
    name: "Project Ion",
    status: "Beta · 50+ TestFlight testers",
    tagline: "Your Vision Pro is a projector now. Professional-grade projection-mapping previsualization — honest ambient simulation, real projector specs, and a full creative rig in your room.",
    pitch:
      "Professional projection-mapping previsualization has always meant expensive software and being on-site. Project Ion puts a real projector twin in your Vision Pro headset: cast images and video onto your actual walls, dial in the exact specs of your Christie, Barco, or Epson rig, and see the honest on-surface contrast as ambient light changes — before you rent a single piece of hardware. More than 50 testers are using it for venue previz, home theater planning, and creative experimentation.",
    sections: [
      {
        heading: "You are the projector",
        body: "In head-locked mode, you're standing in for the projector — the image throws from your exact viewpoint onto your real walls, sized and aimed by the projector twin's throw ratio and native aspect. Switch to placed mode and world-anchor it anywhere in the room. The projection casts real light onto your scanned walls through passthrough — a directional spotlight for the sharp image, and an omnidirectional fill that spills the projection's color across every scanned surface, even ones the beam can't reach.",
      },
      {
        heading: "Real projector specs, honest results",
        body: "Pick a real model — Christie, Barco, Epson, Samsung The Premiere, BenQ, Hisense — and Project Ion loads its actual lumens, throw ratio, native contrast, and resolution. Toggle Honest Ambient Preview and step from blackout to daylight: watch the on-surface contrast collapse, read the recommended lumens for a legible 20:1, and see sharpness in px/cm. You learn what your rig will actually do to the room before anything ships.",
      },
      {
        heading: "A full multi-projector rig",
        body: "Add as many projectors as the scene needs. Each has its own content, pose, creative look, and projector-twin spec. A DCC-style transform gizmo (axis-constrained arrows + rings, Maya/Blender-style) gives you precise placement. Affect All routes one content pick or look to every projector simultaneously; turn it off to target one at a time. Drop placeable spatial-audio speakers anywhere in the room for multichannel setups.",
      },
      {
        heading: "Content, looks, and all the test patterns",
        body: "Photos, looping video (streams in about one second regardless of clip length), procedural animated effects, and a full set of alignment test patterns — grid, crosshatch, color bars, focus, and white field. Per-projector creative looks: Black & White, Sepia, Invert, Vivid, Noir, plus manual Saturation / Contrast / Brightness. The rig auto-saves and restores on every launch.",
      },
      {
        heading: "Export for MadMapper and Resolume",
        body: "Tap Export rig and get two files: scene.projection.json (projectors with pose, real twin spec, and content) and a photometric rig sheet naming the real projector to rent for each surface — with throw, image size, recommended lumens, and on-surface washout estimate. Import the JSON straight into MadMapper or Resolume and start mapping.",
      },
      {
        heading: "What's coming",
        body: "True perspective projective texturing onto oblique and non-flat surfaces, USDZ import for venue and facade previz, NDI support, a Mac companion, SharePlay for co-directing the same space, and a three-tier split (Consumer · Hobbyist · Professional) once per-tier gating is ready. The tester base is growing — it's a good time to join.",
      },
    ],
    bullets: [
      "Head-locked or world-placed projectors — each with its own content, look, and real projector spec",
      "Honest projector twin: Christie, Barco, Epson, Samsung, BenQ, Hisense presets + lumens/sharpness calculator",
      "Real light spills into your room — directional spotlight + fill that colors every scanned surface",
      "Photos, video (streams in ~1 s), procedural effects, and full alignment test patterns",
      "Creative looks per projector (B&W, Sepia, Invert, Vivid, Noir) + Saturation/Contrast/Brightness",
      "DCC-style transform gizmo: axis-constrained arrows + rings for precise placement",
      "Export for MadMapper / Resolume — scene.projection.json + photometric rig sheet",
      "50+ TestFlight testers — open beta, join free",
    ],
    links: [{ label: "Join the TestFlight beta", url: "https://testflight.apple.com/join/hzXHAZ4B" }],
    video: "ZvIOucsVScw",
    videos: [
      { id: "LOnijsxamts", title: "Projection Mapping Update · Jun 2026" },
      { id: "EqFayHb1AQo", title: "Frank and Bob Visit the Chicago Bean" },
    ],
    accent: "blue",
  },
  {
    slug: "unrealitykit-bridge",
    name: "UnRealityKit Bridge",
    status: "Collaborator beta — hardware-verified",
    tagline: "Unreal Engine as the simulation brain. RealityKit as the renderer. The architecture ILM shipped, opened up.",
    pitch:
      "There are two ways to put Unreal Engine on Apple Vision Pro. One is the native path: UE renders every pixel itself. The other is the path ILM used for Marvel's \"What If…?\": UE runs as the simulation, logic, and asset source while RealityKit — Apple's own renderer — draws the frame. That second path gets you passthrough, occlusion, hover effects, anchors, spatial audio, and Personas for free, because you're rendering with the system. UnRealityKit Bridge is that architecture, productized.",
    sections: [
      {
        heading: "Preview before you build",
        body: "The Live Link Previewer is the lead tool: connect your live Unreal Editor to the RealityKit viewer over the Remote Control API and see a translated preview on device — no packaged build, no full framework compile. Run `make previewer` and stream your scene through the bridge the moment you wire up the plugin (Window ▸ UnRealityKit Live Link). It's the fastest iteration loop for mixed-reality UE content that exists.",
      },
      {
        heading: "Know what bridges before you build",
        body: "The BridgeabilityAnalyzer classifies every material and Blueprint in your UE project before you invest in a full bridge build: native-mirror (direct MaterialX path), needs-seam (custom translation required), or hard-wall (manual intervention). Run it against your project and get a coverage score and per-material report so you know exactly what you're walking into — and can prioritize the right assets for your production.",
      },
      {
        heading: "What's already real",
        body: "The live arc is hardware-verified end-to-end on Apple Vision Pro: UE boots headless inside the visionOS shell, a full room mirrors across the bridge with translated materials, lights mirror over the seam, audio is positional, and input flows back — tap-poke, pinch-grab-and-throw into Chaos physics, rotate-with-hand. One live simulation presents through a Mixed / Immersive / Volume (tabletop miniature) picker. At 90 fps. On device.",
      },
      {
        heading: "The material translator",
        body: "The hardest single problem: every UE material has to become a RealityKit ShaderGraph. The bridge translates UE material graphs to MaterialX — texture binding, colorspace, lighting response, normal-map conventions, alpha and opacity, dynamic parameters — each milestone render-verified against ground truth. The BridgeabilityAnalyzer scores your project first so you know what to expect before touching the translator.",
      },
      {
        heading: "Why it matters",
        body: "For polished mixed reality on Vision Pro, rendering with RealityKit beats fighting the compositor. A flagship Disney/Marvel production validated the architecture; an open bridge makes it available to everyone else. The repo is proprietary — bring your own Unreal Engine source license; Epic-linked GitHub accounts can request collaborator access. Royalty-free until $1M revenue.",
      },
    ],
    bullets: [
      "UE simulation + RealityKit rendering — best of both worlds for MR",
      "Live Link Previewer: stream your live UE editor to device, no packaged build required",
      "BridgeabilityAnalyzer: classify every material before you invest in a full bridge build",
      "Verified on device: room mirror, live Lumen GI, materials, spatial audio, Chaos physics input",
      "Mixed / Immersive / Volume presentation modes from one simulation",
      "UE material graph → MaterialX ShaderGraph translation pipeline",
    ],
    links: [],
    video: "AJC9-nNenAk",
    videos: [
      { id: "uf9O7hkbYwQ", title: "Cropping a MetaHuman in visionOS 27" },
      { id: "0xpZmB7ia1E", title: "Lumen Update" },
      { id: "q1Y5C86BxP0", title: "Live Link Test" },
      { id: "ePhtrL1mtBw", title: "Skinned Skeletal Mesh Testing" },
    ],
    accent: "purple",
  },
  {
    slug: "pinchwork",
    name: "Pinchwork",
    status: "In development",
    tagline: "Universal OpenXR hand tracking. Built in Unreal first — designed for every headset, not just one.",
    pitch:
      "Hand tracking should be a starting point, not a research project. Pinchwork is a template that treats hands as the primary input across the whole OpenXR ecosystem — Apple Vision Pro today, every OpenXR headset by design. Pinch to grab, throw with real physics, rotate objects with your hand, swap entire levels with a pinky-pinch — every gesture codified into Unreal's Enhanced Input system so your gameplay code never knows it's reading a hand.",
    sections: [
      {
        heading: "Gestures as first-class input",
        body: "Raw skeletal hand data becomes named, rebindable input actions: pinch, grab, pinky-pinch, poke. Build gameplay against Enhanced Input Actions exactly like you would for a gamepad — the hand-tracking layer is swappable per platform underneath.",
      },
      {
        heading: "Mixed reality, done properly",
        body: "Pinchwork ships in passthrough mixed immersion with materials engineered to survive it: passthrough-safe opaque text and glass, de-stretched triplanar surfaces, and two themed travel levels — a cool metal lab and a warm stone courtyard — that swap in place while everything stays resident in memory.",
      },
      {
        heading: "Why 'universal' is the point",
        body: "Most hand-tracking samples are demos for a single device. Pinchwork's contract is the OpenXR hand-tracking extension itself — which means the same template, the same gestures, and the same interactions work wherever OpenXR does.",
      },
    ],
    bullets: [
      "Pinch-to-grab with throw physics, rotate-with-hand, hide-on-grab",
      "Gesture → Enhanced Input codification — rebindable, platform-agnostic",
      "Passthrough-safe material library for mixed immersion",
      "Level travel via gesture, with assets kept resident across loads",
    ],
    links: [],
    video: "R6NGhLpUZnw",
    accent: "teal",
  },
  {
    slug: "unreal-visionos",
    name: "Unreal × visionOS",
    status: "Ongoing engine contributions",
    tagline: "The punch list for making Unreal Engine on Apple Vision Pro feel production-ready.",
    pitch:
      "Unreal's Vision Pro support is officially Experimental: source-only builds, sparse docs, and a set of sharp edges every team hits in the same order. Rather than working around them, this is an ongoing effort to fix them at the engine level — contributed through the community fork ecosystem where visionOS UE development actually lives.",
    sections: [
      {
        heading: "Lifecycle & stability",
        body: "The crown-exit 'purgatory' fix: dismissing the immersive scene via the Digital Crown used to leave a zombie process holding the OS's singleton immersive layer, so the next launch needed a device reboot. And the level-travel fix: OpenLevel and ServerTravel crashed the compositor on every transition — a frame-lifecycle guard (upstreamed as a fork PR) makes multi-level visionOS apps possible at all.",
      },
      {
        heading: "Rendering & passthrough",
        body: "Translucency over passthrough used to produce blocky grey halos around glass, smoke, and glow — a depth/alpha invariant Apple's compositor enforces and the engine didn't satisfy. The fix lands real glass in mixed reality. Plus: foveation artifact mitigation, and passthrough-safe material patterns documented for everyone.",
      },
      {
        heading: "The Mac-native toolchain",
        body: "Lightmass — Unreal's baked-lighting renderer — shipped x86-only and crashed under Rosetta on Apple Silicon (Embree probes for AVX). A native arm64 Lightmass build makes baked lighting possible on the same M-series Mac you deploy from. Add layered parallax app icons, simulator build revival, and headless commandlet pipelines, and the whole loop runs on one machine.",
      },
    ],
    bullets: [
      "Crown-exit lifecycle fix — no more reboot-to-recover",
      "OpenLevel / ServerTravel compositor fix, upstreamed as a fork PR",
      "Passthrough translucency depth/alpha fix — real glass in mixed reality",
      "Native arm64 Lightmass — baked lighting on Apple Silicon",
      "Layered parallax app icons, simulator builds, headless cook pipelines",
    ],
    links: [],
    video: "PLynIuxA9r8",
    accent: "blue",
  },
  {
    slug: "constellation",
    name: "Constellation",
    status: "Private — building toward bring-your-own-vault",
    tagline: "Your second brain as a navigable 3D star map. Walk through your own notes on Apple Vision Pro.",
    pitch:
      "Your knowledge base is just files on disk until you can walk through it. Constellation turns any folder of markdown notes — an Obsidian vault, a personal wiki, a second brain — into a 3D star map on Apple Vision Pro: pinch a star to read the note, trace the wiki-links between ideas as literal beams of light, and step into an immersive space to stand inside the whole graph. It's private today, built and tuned against Alex's own knowledge base — the goal is generalizing it into something anyone with a vault of notes can point at their own.",
    sections: [
      {
        heading: "Your notes, as a place",
        body: "Every note is a node floating in space; every [[wiki-link]] is an edge of light between ideas. A node's size grows with how many other notes link to it, clusters are colored by top-level folder, and recently-touched notes glow — so the shape of the graph itself tells you what's been alive lately, not just what exists.",
      },
      {
        heading: "Stand inside the graph",
        body: "Step into an immersive space and the constellation surrounds you: stars twinkle, ambient stardust drifts between ideas, and the selected note grows a breathing halo plus a floating glass title card that always turns to face you. On visionOS 27, it casts real light into the room — a soft ambient Room Glow from the graph's heart and a selection light tinted to the chosen note's cluster color, both spilling onto your actual walls via RealityKit's new SurroundingsLight.",
      },
      {
        heading: "It's alive, not a snapshot",
        body: "This is a live force-directed graph, like a d3 playground you stand inside: pinch-grab any star and drag it, and it pins to your hand while the rest of the graph reheats and flows around it (a Physics toggle switches to a cheaper static drag). Layout sliders — Spacing, Gravity, Spread — plus a Reheat button rearrange the whole constellation in real time, and folder filters re-flow the layout live instead of just hiding stars.",
      },
      {
        heading: "Read where you look",
        body: "Titles appear where you look — Focus mode shows the star at the center of your view, Nearby shows everything within a tunable view cone — as pooled glass chips driven by head pose, since apps can't read true eye gaze. Looking at any star previews its cluster with a folder-tinted highlight, and the selected card's Read button expands the full note body right there in space.",
      },
      {
        heading: "Privacy first",
        body: "The bundled demo graph is a sanitized, structural-only export — titles, paths, folders, tags, and link edges. No private note bodies, no financial data. The whole point is standing inside your own thinking; what that thinking actually says stays yours.",
      },
    ],
    bullets: [
      "Force-directed 3D graph of your markdown notes — wiki-links become edges of light",
      "visionOS 27: RealityKit SurroundingsLight casts a real Room Glow + selection light onto your walls",
      "Live physics — pinch-grab and drag any star, the whole graph reheats around your hand",
      "Focus/Nearby label modes driven by head pose, since apps can't read true eye gaze",
      "Layout sliders (Spacing/Gravity/Spread) + folder filters that re-flow live, not just hide",
      "Ships with a sanitized, structural-only demo graph — no private note bodies",
    ],
    links: [],
    accent: "purple",
  },
];

// ── About: timeline ─────────────────────────────────────────────────────────

export const timeline: { year: string; title: string; detail: string }[] = [
  { year: "2009", title: "AR before it was cool", detail: "Architecture thesis at Fort Jay, Governors Island — an immersive theatre installation pioneering early AR with webcams and printed markers. The origin story." },
  { year: "2013", title: "First VR theatrical sightlines — anywhere", detail: "Discovers the Oculus DK1 Kickstarter while at Fisher Dachs Associates and pioneers the world's first use of VR for theatrical sightline testing." },
  { year: "2014", title: "Agile Lens founded", detail: "An immersive design studio born from architecture and theatre. Clients would come to include the Four Seasons, Royal Shakespeare Company, NEOM, Samsung, Intel, and Royal Caribbean." },
  { year: "2016", title: "Early UE4 VR for real buildings", detail: "Yale Schwarzman Center in UE4 VR; The Shed at Hudson Yards equipment clearance; the Statue of Liberty Museum. Real decisions, made in headsets." },
  { year: "2019", title: "Live performance goes immersive", detail: "Ghosted — an award-winning volumetric AR piece on Magic Leap. 'Loveseat' at the Venice Biennale: the first live VR show viewable globally." },
  { year: "2021", title: "A Christmas Carol VR", detail: "Two live actors, 45 minutes, avatar switching, facial capture — free on Quest, every year since. Raindance Immersive 2025 Official Selection." },
  { year: "2024", title: "Royal Shakespeare Company R&D", detail: "A mixed-reality rehearsal application with the RSC. Theatre and XR, finally in the same room." },
  { year: "2025", title: "SIGGRAPH", detail: "'Seeing Yourself on Stage: Multi-Avatar Performance and the Evolution of Self-Monitoring in VR' — published research from a decade of live VR performance." },
  { year: "2026", title: "HarvardXR closing keynote", detail: "'10 Lessons from 10 Years of Running an XR Enterprise Studio' — delivered in Spatial Deck, a presentation framework built (with AI) for the occasion, then open-sourced." },
];

export const roles: string[] = [
  "XR-chitect",
  "Unreal Authorized Instructor",
  "Godot × Vision Pro pioneer",
  "AI fleet commander",
  "recovering architect",
  "theatre director's secret weapon",
  "podcast host",
  "Blueprint un-spaghettifier",
];

// ── Training ────────────────────────────────────────────────────────────────

export const courses: { name: string; blurb: string; isNew?: boolean }[] = [
  { name: "AI for Unreal Engine", blurb: "MCP servers, AI build agents, and LLM-assisted workflows inside the editor. The new frontier.", isNew: true },
  { name: "Intro to Unreal", blurb: "The editor, the content browser, and the mental model that makes everything else click." },
  { name: "Blueprints & C++", blurb: "Visual scripting done right, when to drop to C++, and how the two layers talk." },
  { name: "Sequencer", blurb: "Cinematics, cutscenes, and choreographed sequences — Unreal as a film tool." },
  { name: "Multiplayer", blurb: "Replication, network prediction, and the architecture decisions you can't undo later." },
  { name: "VR & AR (incl. Apple Vision Pro)", blurb: "From Quest to Vision Pro — comfort, performance budgets, and platform realities." },
  { name: "ArchViz", blurb: "Photoreal architectural visualization — the discipline Agile Lens built nine-figure sales on." },
  { name: "Pixel Streaming", blurb: "Unreal in the browser: GPU servers, signalling, and shipping interactive experiences as URLs." },
  { name: "MetaHumans", blurb: "Creation, animation, mocap pipelines, and real-time digital humans that hold up close." },
  { name: "Virtual Production", blurb: "Live events, LED volumes, and broadcast — where game engines meet showtime." },
  { name: "Final Output", blurb: "Packaging, optimization, and delivery for every target — the last mile most courses skip." },
  { name: "Unity to Unreal", blurb: "For teams making the switch: the concepts that map over, the ones that don't, and why your prefabs are now actors." },
];

// ── AI Training Topics ───────────────────────────────────────────────────────

export const aiTopics: { t: string; d: string }[] = [
  { t: "Agents that ship real work", d: "Designing AI agents that do useful things — not demos. Guardrails, tools, and verification so they don't go off the rails." },
  { t: "Claude Code & MCP", d: "Driving real codebases with Claude Code, writing MCP servers, and wiring agents into the tools you already use." },
  { t: "AI for Unreal Engine", d: "MCP servers and build agents that drive Unreal — overnight builds that greet you with a TestFlight app by morning." },
  { t: "Running a local model fleet", d: "Standing up your own machines and open models to offload work from the paid APIs and protect your budget." },
  { t: "Prompting for production", d: "Moving past chat tricks into repeatable, testable prompt + context pipelines you can actually ship." },
  { t: "You tell us", d: "This curriculum is being shaped right now. Sign up and say what you'd want — it helps decide what gets built first." },
];

export const aiTalk = {
  videoId: "JR5397NUz3I",
  title: "How to Use AI & MCP for Blender, Unreal & Godot",
  blurb:
    "A live 2-hour workshop for SIGGRAPH 2026 LA's Worlds in Action hackathon (with Sensei AI) — headless vs. MCP workflows, running a local model fleet, and the second-brain knowledge base behind all of it. Scheduled for one hour; the room didn't let Alex leave for two.",
  host: "Sensei AI × SIGGRAPH 2026 LA",
};

// ── Epic Games Archive Courses ───────────────────────────────────────────────

export const epicCourses: { kind: "Video" | "Course" | "Talk"; name: string; note: string; href: string }[] = [
  { kind: "Video", name: "Intro to OpenXR", note: "The very first — adapted for Unreal Fest 2022.", href: "https://youtu.be/JD95BklloHk" },
  { kind: "Course", name: "FBX: Data Ingestion", note: "Getting FBX data into Unreal cleanly.", href: "https://dev.epicgames.com/community/learning/courses/Lre/unreal-engine-fbx-data-ingestion/qEL5/unreal-engine-introduction" },
  { kind: "Course", name: "Datasmith Ingestion", note: "Bringing CAD and DCC scenes in via Datasmith.", href: "https://dev.epicgames.com/community/learning/courses/7Na/unreal-engine-datasmith-ingestion/L0YB/unreal-engine-introduction" },
  { kind: "Talk", name: "Mind the Gap: Transitioning from Unity to Unreal", note: "Led by Whitt Sellers.", href: "https://dev.epicgames.com/community/learning/talks-and-demos/0yX9/unreal-engine-mind-the-gap-transitioning-from-unity-to-unreal" },
  { kind: "Course", name: "Using Magic Leap in Unreal Engine", note: "A 2019 classic that's still surprisingly relevant.", href: "https://dev.epicgames.com/community/learning/courses/Ml7/using-magic-leap-in-unreal-engine/pbx/introducing-using-magic-leap-in-unreal-engine" },
];

// ── Links ───────────────────────────────────────────────────────────────────

export const externalLinks: {
  label: string;
  url: string;
  note: string;
  vibe?: "serious" | "joke";
  extra?: { label: string; url: string };
}[] = [
  {
    label: "Agile Lens",
    url: "https://agilelens.com",
    note: "The immersive design studio Alex co-founded. Ten years of XR for architecture, theatre, and brands you've heard of — Hyperreal Estate, Holodeck Anywhere, Stage Presence, and more.",
    vibe: "serious",
    extra: { label: "Browse the portfolio", url: "https://agilelens.com/portfolio" },
  },
  { label: "alexcoulombe.com", url: "http://alexcoulombe.com", note: "Lovingly preserved in 2013 amber. The TLS certificate has been on sabbatical for years. Enter via the Wayback Machine to experience it in its full Macromedia Flash glory, as nature intended.", vibe: "joke" },
  { label: "GitHub — @ibrews", url: "https://github.com/ibrews", note: "Where the code lives. Engines plural, agents plural.", vibe: "serious" },
  {
    label: "Unreal NYC",
    url: "https://agilelens.com/unrealnyc",
    note: "The NYC Unreal Engine meetup, led by Alex — talks, demos, and the only room in Manhattan where 'nanite' is small talk.",
    vibe: "serious",
    extra: { label: "Official Epic community page", url: "https://communities.unrealengine.com/new-york" },
  },
  {
    label: "The (Unofficial) Unreal Engine Podcast",
    url: "https://linktr.ee/unoffunrealpod",
    note: "Co-hosted with Jacob Feldman. Unreal news, takes, and guests.",
    vibe: "serious",
    extra: { label: "All platforms (Linktree)", url: "https://linktr.ee/unoffunrealpod" },
  },
  {
    label: "LinkedIn",
    url: "https://linkedin.com/in/alexcoulombe",
    note: "16,000+ followers' worth of XR hot takes and project reveals.",
    vibe: "serious",
    extra: { label: "Recent: the Europe tour recap (FMX + NXT BLD)", url: "https://www.linkedin.com/posts/alexcoulombe_long-overdue-europe-post-1-of-2-this-activity-7464479226625265665-d8dF" },
  },
  { label: "X / Twitter — @ibrews", url: "https://twitter.com/ibrews", note: "Shorter hot takes.", vibe: "serious" },
  { label: "YouTube", url: "https://youtube.com/@ibrews", note: "Tutorials ('I Wish I Learned This Sooner'), Unity→UE5 migration guides, MetaHuman deep dives.", vibe: "serious" },
];

export const site = {
  title: "Alex Coulombe Presents",
  description:
    "Unreal Engine, Godot, Apple Vision Pro, AI agents, and a decade of immersive design — plus Manhattan's first Unreal Authorized Training Center.",
  url: "https://alexcoulombepresents.com",
};

// ── Videos ──────────────────────────────────────────────────────────────────

export type Video = { id: string; title: string; tag: string; blurb?: string };

export const featuredVideo: Video = {
  id: "ilxU8mcJvC0",
  title: "Everything I've Built for Apple Vision Pro So Far",
  tag: "Vision Pro",
  blurb: "The grand tour: Unreal, Godot, RealityKit, Gaussian splats, hand tracking — every AVP experiment in one sitting.",
};

export const videos: Video[] = [
  { id: "ZvIOucsVScw", title: "Project Ion — Projection Mapping Previz", tag: "Vision Pro", blurb: "The full demo: cast images and video onto real walls, dial in projector specs, and export a rig for MadMapper." },
  { id: "LOnijsxamts", title: "Project Ion — Projection Mapping Update", tag: "Vision Pro", blurb: "June 2026 feature update: spatial audio speakers, multi-projector workflow, and the complete creative rig." },
  { id: "EqFayHb1AQo", title: "Frank and Bob Visit the Chicago Bean", tag: "Vision Pro", blurb: "Shadow puppets meet projection mapping — a creative experiment built with Project Ion." },
  { id: "AJC9-nNenAk", title: "UnRealityKit — Unreal Engine + RealityKit Bridge", tag: "Vision Pro", blurb: "The Lab project, running live: UE simulating, RealityKit rendering." },
  { id: "0xpZmB7ia1E", title: "UnRealityKit — Lumen Update", tag: "Vision Pro", blurb: "Lumen global illumination mirrored across the bridge into RealityKit." },
  { id: "q1Y5C86BxP0", title: "UnRealityKit — Live Link Test", tag: "Vision Pro", blurb: "The Live Link Previewer: streaming a live UE editor scene to device without a packaged build." },
  { id: "uf9O7hkbYwQ", title: "Cropping a MetaHuman in visionOS 27", tag: "Vision Pro", blurb: "Spatial masking and cropping of a MetaHuman in the visionOS 27 runtime — UnRealityKit Bridge in action." },
  { id: "0U0C2GRuPLA", title: "Quick Look at visionOS 27 New Environment Features", tag: "Vision Pro" },
  { id: "-2zL1m6rzhU", title: "Apple Vision Pro Without Apple Vision Pro", tag: "Vision Pro" },
  { id: "SfmLwmJ4bkg", title: "SHARP splats generated & viewed on Apple Vision Pro", tag: "Vision Pro" },
  { id: "PLynIuxA9r8", title: "Translucency over Mixed Reality for Vision Pro", tag: "Vision Pro", blurb: "The engine fix from the Unreal × visionOS punch list, demonstrated." },
  { id: "R6NGhLpUZnw", title: "Unreal Engine AVP — Improved Hand Tracking & Interaction", tag: "Unreal", blurb: "The work that became Pinchwork." },
  { id: "C6FQKW2uNXo", title: "MetaHuman to Godot", tag: "Godot", blurb: "The pipeline behind the MetaHumanGodot repo." },
  { id: "iRnbWTv1HkQ", title: "MetaHumans in Godot? In VR?!", tag: "Godot", blurb: "The VR preview build: room-scale MetaHuman on Quest via Godot 4.7-beta3." },
  { id: "p0JoPJb4e84", title: "VR Depth of Field in Godot", tag: "Godot" },
  { id: "ePhtrL1mtBw", title: "UnRealityKit Bridge — Skinned Skeletal Mesh Testing", tag: "Vision Pro", blurb: "Full skeletal mesh with skinning streaming across the UnRealityKit Bridge." },
  { id: "lWBnHLWnNjs", title: "Apple just released a Godot RealityKit Plugin!", tag: "Godot" },
  { id: "VnNzJV61dxs", title: "My First Godot Experience for Apple Vision Pro", tag: "Godot" },
  { id: "qk5RzMD_ffQ", title: "This week I built a Claude-Fleet", tag: "AI", blurb: "The multi-machine agent system, explained by its operator." },
  { id: "hbqUwZbsj-E", title: "When Claude Gives You Surprise Tokens — Unreal, Godot, Vision Pro & More", tag: "AI" },
  { id: "j_-by9Wk3A0", title: "Porting XR, Headless Godot, Humans in the /loop", tag: "AI" },
  { id: "Q-wwh8Sw8Eg", title: "Claude Desktop is What We've Been Looking For", tag: "AI" },
  { id: "6uoo9r0rpSs", title: "Unreal Engine WebXR Pixel Streaming to Apple Vision Pro (and Quest too!)", tag: "Unreal" },
  { id: "NUOpEwT0YUs", title: "MetaHuman Full Body Mocap Using Only Meta Quest Pro!", tag: "Unreal" },
  { id: "_h8mE20vzlw", title: "A Christmas Carol VR — How we do the livestream!", tag: "Theatre", blurb: "Behind the scenes of live actors performing in headsets." },
  { id: "uGWej_6kjC8", title: "Unreal Fest 2026 — Live Dev Stream", tag: "Talks" },
  { id: "M1J25jJ79U8", title: "I Wish I Learned This Sooner! Part 2 — Unreal Fest Stockholm 2025", tag: "Talks" },
  { id: "m0T8euG9Rh8", title: "I Wish I Learned This Sooner! — Unreal Fest 2024", tag: "Talks" },
  { id: "8NOcf3RsH1k", title: "GDC 2022 — Up Close & Virtual: The Power of Live Actors in VR", tag: "Talks" },
  { id: "vT1T2unF8EI", title: "What You Didn't Know About VR Development in Unreal | Inside Unreal", tag: "Talks" },
];

export const trainingPlaylist = {
  id: "PLBHPEwkDnRDemC1EPbDIyKhkXu5gPGWFN",
  title: "Alex Coulombe Unreal Engine Talks",
  count: 46,
  blurb: "Every conference talk in one playlist — Unreal Fest, GDC, Inside Unreal, and more. The free preview of how Alex teaches.",
  featuredVideoId: "M1J25jJ79U8",
};

export const playlists: { id: string; title: string; blurb: string }[] = [
  { id: "PLBHPEwkDnRDemC1EPbDIyKhkXu5gPGWFN", title: "Alex Coulombe Unreal Engine Talks", blurb: "46 conference talks: Unreal Fest, GDC, Inside Unreal." },
  { id: "PLBHPEwkDnRDfa4kxE7u4idWvBkbHoEkk-", title: "Alex Vision Pro", blurb: "Every Apple Vision Pro experiment, in order." },
  { id: "PLBHPEwkDnRDco-vxai_cyhnQII_sys5DI", title: "VR Talks, Tests & Tutorials", blurb: "The deep archive — a decade of headset honesty." },
  { id: "PLBHPEwkDnRDd2EaCeOBMNUg_RdOmXdif7", title: "MetaHuman Animator", blurb: "Digital humans, animated for real productions." },
  { id: "PLBHPEwkDnRDeGHS1mW8p1LPfL0aPisjWN", title: "Pixel Streaming Stuff!", blurb: "Unreal in the browser, from quickstart to multi-camera." },
  { id: "PLBHPEwkDnRDe4m8PcrNBgv5_DWJTWsbJ2", title: "The (Unofficial) Unreal Engine Podcast", blurb: "Episodes with co-host Jacob Feldman." },
  { id: "PLBHPEwkDnRDf7JV8iJM2kV-n3zAP6mIZ7", title: "A Christmas Carol VR", blurb: "The annual live VR theatre production." },
  { id: "PLBHPEwkDnRDeo1g9OnZSSDLJsKk8iOTPg", title: "Introducing Stage Presence", blurb: "The live performance platform, unveiled." },
];

// ── AI Skills (Capafy + open source) ────────────────────────────────────────

export type AgentSkill = {
  name: string;
  status: "live" | "coming-soon" | "free";
  blurb: string;
  detail: string;
  link?: { label: string; url: string };
};

export const agentSkills: AgentSkill[] = [
  {
    name: "ue5-testflight",
    status: "live",
    blurb: "Ship Unreal Engine 5 projects to TestFlight — macOS, iOS, and visionOS.",
    detail:
      "The autonomous UE5 → TestFlight pipeline, packaged as a skill your own Claude runs. Cook, stage, sign, version-bump, upload, distribute — every gotcha from shipping real visionOS apps documented inside.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/product/ue5-testflight" },
  },
  {
    name: "ios-testflight",
    status: "live",
    blurb: "Archive and upload iOS / visionOS / macOS Xcode projects to TestFlight via CLI.",
    detail:
      "The native-Xcode sibling: altool-free uploads, signing-identity sanity checks, build-number discipline, and the export-options matrix that actually works. Runs entirely in your own Claude.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/product/ios-testflight" },
  },
  {
    name: "metahuman-godot-pipeline",
    status: "live",
    blurb: "The complete MetaHuman → Blender → Godot conversion workflow, as a skill.",
    detail:
      "Full export, ARKit morph-target bake, material reassembly, and the shader stack — with real scripts, not prose. The paid counterpart to the free MetaHumanGodot viewer.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/product/metahuman-godot-pipeline" },
  },
  {
    name: "spatial-deck-maker",
    status: "live",
    blurb: "Turn messy slides, PDFs, or notes into an interactive Spatial Deck presentation you share as a link.",
    detail:
      "Feed it your raw content; get back a single-file web presentation in the Spatial Deck framework — the one that powered the HarvardXR closing keynote.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/product/spatial-deck-maker" },
  },
  {
    name: "app-store-aso",
    status: "live",
    blurb: "Generate a character-perfect, ASO-optimized App Store listing kit from your app's features.",
    detail:
      "Titles, subtitles, keyword fields, descriptions, promotional text — every character limit respected, every field tuned for App Store search.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/product/app-store-aso" },
  },
  {
    name: "interview-coach-pro",
    status: "live",
    blurb: "Mock interviews and salary negotiation coaching — STAR method, FAANG structures, real comp research.",
    detail:
      "Runs behaviorals, system-design rounds, and offer-negotiation drills. Grounds every answer in documented interview frameworks and compensation data.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/product/interview-coach-pro" },
  },
  {
    name: "godot-visionos",
    status: "coming-soon",
    blurb: "Build Godot apps for Apple Vision Pro — flat-plane and full immersive.",
    detail:
      "Everything learned shipping Cascade Countdown: the build switcher, simulator input, hand tracking, and the silent-failure traps that cost device round-trips.",
  },
  {
    name: "ue5-mcp",
    status: "free",
    blurb: "A field manual for AI agents driving Unreal Engine 5 through MCP.",
    detail:
      "Free and open source. Reflection gotchas, crash patterns, subsystem quirks — install it and your agent stops rediscovering UE's sharp edges every session.",
    link: { label: "GitHub", url: "https://github.com/ibrews/ue5-mcp" },
  },
  {
    name: "apple-platform-skills",
    status: "free",
    blurb: "Claude Code skills for visionOS SharePlay, SpriteKit, and GameKit multiplayer.",
    detail:
      "Free and open source. npx skills add ibrews/apple-platform-skills — and your agent knows the session.join() trap before it falls in.",
    link: { label: "GitHub", url: "https://github.com/ibrews/apple-platform-skills" },
  },
];
