// ── Site-wide data ──────────────────────────────────────────────────────────
// One file, one source of truth. Pages import from here.

export type Repo = {
  slug: string;
  name: string;
  tagline: string;
  category: "Unreal Engine" | "Godot × Vision Pro" | "visionOS & Spatial" | "AI & Agents" | "Tools";
  stars: number; // baked fallback — live count fetched client-side
  language: string;
  story: string;
  highlights: string[];
  links: { label: string; url: string }[];
  github: string;
  wiki?: string;
  video?: string; // YouTube id for a "watch the demo" link
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
    category: "Godot × Vision Pro",
    stars: 7,
    language: "GDScript",
    story:
      "Emissive cubes cascade through spinning bumpers and a prism splitter onto tilted catch plates in your immersive space. Reach in and pinch to grab and throw. Every collision is a synthesized chime pitch-snapped to the key, so the chaos harmonizes into a tune. The first publicly-documented Godot RigidBody3D physics scene rendering in immersive mode on real Apple Vision Pro at a locked 90 FPS, with working hand-tracking pickup — built on Apple's official upstream visionOS contribution to Godot.",
    highlights: [
      "Locked 90 FPS immersive-mode physics on real AVP hardware",
      "Pinch-to-grab-and-throw with full hand tracking",
      "Procedural soundtrack — collisions synthesize chimes in key",
      "Beginner-friendly ELI5 wiki walking through how it was all built",
      "Free public beta on TestFlight",
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
    tagline: "Interactive look-dev for MetaHuman characters in stock Godot 4.6 — live skin/lighting/hair sliders.",
    category: "Godot × Vision Pro",
    stars: 6,
    language: "GDScript",
    story:
      "MetaHumans rendered in stock Godot 4.6 Forward+ — no engine fork, no custom build. A real-time look-development and turntable tool: dial in skin, lighting, hair, and eyes with live sliders, and drive all 52 ARKit facial blendshapes. Bring your own MetaHuman (assets aren't redistributed — Epic EULA respected).",
    highlights: [
      "Stock Godot 4.6 Forward+ — AgX, SSIL, screen-space subsurface scattering",
      "The MatMADNESS skin shader stack, fully sliderized",
      "52 ARKit facial blendshape drivers",
      "Orbit camera + turntable for look-dev comparisons",
    ],
    links: [],
    github: "https://github.com/ibrews/MetaHumanGodot",
    video: "C6FQKW2uNXo",
    wiki: "https://github.com/ibrews/MetaHumanGodot/wiki",
  },
  {
    slug: "VitruvianGodot",
    name: "VitruvianGodot",
    tagline: "A fully CC0, EULA-free photoreal digital human in stock Godot — ship it anywhere.",
    category: "Godot × Vision Pro",
    stars: 1,
    language: "GDScript",
    story:
      "The free counterpart to MetaHumanGodot: a CC0 real-time digital human — rigged body, expressive FACS face, eyes, physics hair — running in stock Godot 4.6 Forward+, with no Epic MetaHuman EULA attached. Everything can be redistributed, cloud-rendered, and shipped in closed-source commercial products. Same rendering tech as the MetaHuman pipeline, different (free) source character.",
    highlights: [
      "100% CC0 — redistribute, cloud-render, ship commercially",
      "Same MatMADNESS skin shader stack as MetaHumanGodot",
      "Rigged body + FACS face + physics hair",
      "No Unreal, no fork, no strings",
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
  video?: string; // YouTube id for a "watch the demo" link
};

export const products: Product[] = [
  {
    slug: "forage",
    name: "Forage",
    status: "Private beta — wishlist open",
    tagline: "Fab's ultimate companion. An AI-first asset scout for the Unreal Engine packs you already own.",
    pitch:
      "You've bought hundreds of asset packs over years of Fab and Marketplace sales — and you can't remember what's in any of them. Forage takes a creative intent like \"amazing castle with horses running around the gates\" and matches it against your owned library: the 2–3 best-fit packs, the hero assets inside them, and which project versions are dead weight you can prune.",
    sections: [
      {
        heading: "Built for the AI-build-agent era",
        body: "Forage returns structured JSON designed to hand straight to an AI build agent — an in-editor MCP plugin, Cursor driving UE, or a human reading the output. 'You already own Medieval Castle Walls Pro; hero asset is SM_CastleGate; the UE 5.5 artifact is the one you want.' Your agent builds; Forage scouts.",
      },
      {
        heading: "A wishlist without the cap",
        body: "Fab caps your wishlist around 150 items. Forage keeps an unlimited local one — and tells you when a wishlisted pack lands in your owned library. For things you don't own yet, it opens Fab in your browser so you can shop like a human.",
      },
      {
        heading: "Not a marketplace, not a generator",
        body: "Forage doesn't sell assets and doesn't synthesize them. It's a really good scout for the packs you already paid for — which it turns out is the thing everyone actually needed.",
      },
    ],
    bullets: [
      "Creative intent in, ranked owned-pack matches out",
      "Structured JSON handoff to any AI build agent",
      "Unlimited local wishlist with owned-library sync alerts",
      "Bloat estimates: know which pack versions are dead weight",
    ],
    links: [{ label: "Landing page + wishlist", url: "https://ibrews.github.io/forage-site/" }],
    accent: "amber",
  },
  {
    slug: "unrealitykit-bridge",
    name: "UnRealityKit Bridge",
    status: "In development — hardware-verified",
    tagline: "Unreal Engine as the simulation brain. RealityKit as the renderer. The architecture ILM shipped, opened up.",
    pitch:
      "There are two ways to put Unreal Engine on Apple Vision Pro. One is the native path: UE renders every pixel itself. The other is the path ILM used for Marvel's \"What If…?\": UE runs as the simulation, logic, and asset source while RealityKit — Apple's own renderer — draws the frame. That second path gets you passthrough, occlusion, hover effects, anchors, spatial audio, and Personas for free, because you're rendering with the system. UnRealityKit Bridge is that architecture, productized.",
    sections: [
      {
        heading: "What's already real",
        body: "The live arc is hardware-verified end-to-end on Apple Vision Pro: UE boots headless inside the visionOS shell, a full room mirrors across the bridge with translated materials, lights mirror over the seam, audio is positional, and input flows back — tap-poke, pinch-grab-and-throw into Chaos physics, rotate-with-hand. One live simulation presents through a Mixed / Immersive / Volume (tabletop miniature) picker. At 90 fps. On device.",
      },
      {
        heading: "The material translator",
        body: "The hardest single problem: every UE material has to become a RealityKit ShaderGraph. The bridge translates UE material graphs to MaterialX — texture binding, colorspace, lighting response, normal-map conventions, alpha and opacity, dynamic parameters — each milestone render-verified against ground truth.",
      },
      {
        heading: "Why it matters",
        body: "For polished mixed reality on Vision Pro, rendering with RealityKit beats fighting the compositor. A flagship Disney/Marvel production validated the architecture; an open bridge makes it available to everyone else. (The repo is private per Epic's Unreal Engine source-access policy — Epic-linked collaborators can request access.)",
      },
    ],
    bullets: [
      "UE simulation + RealityKit rendering — best of both worlds for MR",
      "Verified on device: room mirror, live lights, graph materials, spatial audio, physics input",
      "Mixed / Immersive / Volume presentation modes from one simulation",
      "UE material graph → MaterialX ShaderGraph translation pipeline",
    ],
    links: [],
    video: "AJC9-nNenAk",
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
  { label: "YouTube", url: "https://youtube.com/user/ibrews", note: "Tutorials ('I Wish I Learned This Sooner'), Unity→UE5 migration guides, MetaHuman deep dives.", vibe: "serious" },
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
  { id: "AJC9-nNenAk", title: "UnRealityKit — Unreal Engine + RealityKit Bridge", tag: "Vision Pro", blurb: "The Lab project, running live: UE simulating, RealityKit rendering." },
  { id: "SfmLwmJ4bkg", title: "SHARP splats generated & viewed on Apple Vision Pro", tag: "Vision Pro" },
  { id: "PLynIuxA9r8", title: "Translucency over Mixed Reality for Vision Pro", tag: "Vision Pro", blurb: "The engine fix from the Unreal × visionOS punch list, demonstrated." },
  { id: "R6NGhLpUZnw", title: "Unreal Engine AVP — Improved Hand Tracking & Interaction", tag: "Unreal", blurb: "The work that became Pinchwork." },
  { id: "C6FQKW2uNXo", title: "MetaHuman to Godot", tag: "Godot", blurb: "The pipeline behind the MetaHumanGodot repo." },
  { id: "lWBnHLWnNjs", title: "Apple just released a Godot RealityKit Plugin!", tag: "Godot" },
  { id: "VnNzJV61dxs", title: "My First Godot Experience for Apple Vision Pro", tag: "Godot" },
  { id: "qk5RzMD_ffQ", title: "This week I built a Claude-Fleet", tag: "AI", blurb: "The multi-machine agent system, explained by its operator." },
  { id: "Q-wwh8Sw8Eg", title: "Claude Desktop is What We've Been Looking For", tag: "AI" },
  { id: "6uoo9r0rpSs", title: "Unreal Engine WebXR Pixel Streaming to Apple Vision Pro (and Quest too!)", tag: "Unreal" },
  { id: "NUOpEwT0YUs", title: "MetaHuman Full Body Mocap Using Only Meta Quest Pro!", tag: "Unreal" },
  { id: "_h8mE20vzlw", title: "A Christmas Carol VR — How we do the livestream!", tag: "Theatre", blurb: "Behind the scenes of live actors performing in headsets." },
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
    link: { label: "Get it on Capafy", url: "https://capafy.ai/publisher/alex-coulombe-presents" },
  },
  {
    name: "ios-testflight",
    status: "live",
    blurb: "Archive and upload iOS / visionOS / macOS Xcode projects to TestFlight via CLI.",
    detail:
      "The native-Xcode sibling: altool-free uploads, signing-identity sanity checks, build-number discipline, and the export-options matrix that actually works. Runs entirely in your own Claude.",
    link: { label: "Get it on Capafy", url: "https://capafy.ai/publisher/alex-coulombe-presents" },
  },
  {
    name: "godot-visionos",
    status: "coming-soon",
    blurb: "Build Godot apps for Apple Vision Pro — flat-plane and full immersive.",
    detail:
      "Everything learned shipping Cascade Countdown: the build switcher, simulator input, hand tracking, and the silent-failure traps that cost device round-trips.",
  },
  {
    name: "spatial-deck-maker",
    status: "coming-soon",
    blurb: "Turn messy slides, PDFs, or notes into an interactive Spatial Deck presentation you share as a link.",
    detail:
      "Feed it your raw content; get back a single-file web presentation in the Spatial Deck framework — the one that powered the HarvardXR closing keynote.",
  },
  {
    name: "app-store-aso",
    status: "coming-soon",
    blurb: "Generate a character-perfect, ASO-optimized App Store listing kit from your app's features.",
    detail:
      "Titles, subtitles, keyword fields, descriptions, promotional text — every character limit respected, every field tuned for App Store search.",
  },
  {
    name: "metahuman-godot-pipeline",
    status: "coming-soon",
    blurb: "The complete MetaHuman → Blender → Godot conversion workflow, as a skill.",
    detail:
      "The paid counterpart to the free MetaHumanGodot viewer: full export, ARKit morph-target bake, material reassembly, and the shader stack — with real scripts, not prose. In final review.",
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
