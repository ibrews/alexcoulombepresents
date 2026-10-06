// ── "What we covered" summaries for past sessions ─────────────────────────
//
// Generated from each recording's YouTube auto-captions (yt-dlp, English
// original track) and summarized by Gemini Flash with instructions to
// describe only what the transcript shows and never to name attendees.
// Keyed by YouTube video id so a summary can't attach to the wrong class.
// Shown on /classes/[slug] with a visible "AI summary of the recording"
// label. Edit freely — this is data, not a cache; regenerating is a manual
// step (Zoom transcripts can replace captions as the source later).

export type SessionSummary = {
  overview: string;
  covered: string[];
  tools: string[];
  source: "youtube-captions" | "zoom-transcript";
  generatedOn: string; // YYYY-MM-DD
};

export const sessionSummaries: Record<string, SessionSummary> = {
  "FW6xfFzF0_o": {
    overview: "This introductory session outlined upcoming Unreal Engine training topics and explored modern production workflows spanning AI integration, spatial computing, and cross-platform export. Instructors Yu-Jun Yeh and Saurabh Saxena presented demonstrations on Blueprint initialization timing and runtime glTF web exports. Alex Coulombe concluded with live walk-throughs of Live Link Hub webcam facial capture and in-editor mesh-to-MetaHuman conversion.",
    covered: [
      "Structuring AI context with documentation and Model Context Protocol for real-time engine workflows.",
      "Reviewing Epic sample projects and templates including Collab Viewer, City Sample, and procedural generation environments.",
      "Yu-Jun Yeh demonstrated BeginPlay execution order differences between single-player and multiplayer Blueprint pawns.",
      "Resolving invalid pawn references during level startup using event dispatchers and timed verification.",
      "Saurabh Saxena demonstrated runtime level export to a lightweight Three.js web viewer via glTF.",
      "Routing a live webcam feed through Live Link Hub to drive MetaHuman facial animation.",
      "Importing a custom 3D character mesh from Fab into the editor.",
      "Using the in-editor MetaHuman Character autosolve tool to fit rigs and materials to imported geometry.",
    ],
    tools: ["Live Link Hub", "MetaHuman", "glTF Exporter", "Blueprints", "Fab", "Collab Viewer", "Procedural Content Generation (PCG)", "Three.js", "Apple Vision Pro", "Blender"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "0WPJjRclWLQ": {
    overview: "This session established core workflows for developing virtual reality experiences in Unreal Engine 5.8 using OpenXR and the standard VR template. Alex Coulombe walked through rendering pipeline choices, platform dependency setups, and methods for simulating headsets on desktop without physical hardware. The class also covered practical interaction authoring, including object grabbing mechanics, haptic feedback profiles, and 3D widget menu customization in Blueprints.",
    covered: [
      "Setting up XR simulators, OpenXR runtimes, and Android development dependencies for standalone headset packaging.",
      "Comparing forward shading against deferred rendering to meet the performance budgets required for virtual reality.",
      "Configuring Unreal Engine projects on macOS for Apple Vision Pro using the OpenXR VisionOS plugin.",
      "Designing comfortable VR experiences using locomotion methods, comfort vignettes, spectator cameras, and environmental cues.",
      "Running and navigating the VR template without a physical headset using the Meta XR Simulator.",
      "Implementing grabbable objects by adding grab components, setting collision profiles, and enabling physics simulation.",
      "Inspecting interactive weapon mechanics, projectile spawning, and haptic feedback assets using frequency and amplitude curves.",
      "Customizing BP_VRPawn to display motion controllers, modify resolution scale, and adjust input bindings.",
      "Adding interactive Blueprint logic to 3D widget menus to toggle scene lights using UMG buttons.",
    ],
    tools: ["Meta XR Simulator", "OpenXR Plugin", "Forward Shading", "VR Template", "BP_VRPawn", "Grab Component", "Enhanced Input System", "UMG UI Designer", "Device Profiles", "OpenXR VisionOS Plugin"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "RsAk2VfueXA": {
    overview: "This session demonstrated XR development workflows and optimization techniques in Unreal Engine 5.8. Alex Coulombe compared standalone and PCVR rendering pipelines across scenes utilizing baked lighting, Lumen, and Nanite. The class also covered OpenXR pass-through setup, shader complexity troubleshooting, and custom locomotion implementations.",
    covered: [
      "Configuring Unreal Engine and Android SDK environments for XR packaging using setup scripts.",
      "Comparing performance targets across standalone baked, desktop low baked, and desktop high Lumen map configurations.",
      "Managing static, stationary, and movable lighting behavior, lightmap density, and volumetric lightmap probes.",
      "Adjusting post-process volume overrides for screen space reflections, Lumen ray tracing, and convolution bloom.",
      "Inspecting shader instruction counts across unlit, opaque, masked, and complex translucent materials.",
      "Configuring and debugging native and OpenXR pass-through implementations for standalone and PCVR.",
      "Setting up HDRI backdrops with camera projection and aligning directional sun lighting.",
      "Examining VR locomotion mechanics including dash teleport, flying, comfort vignettes, and world scaling.",
      "Applying performance optimizations using actor merging, cull distance volumes, and VR pixel density adjustments.",
    ],
    tools: ["Lumen", "Nanite", "OpenXR", "Post Process Volume", "HDRI Backdrop", "Light Mixer", "Widget Reflector", "Meta Horizon Link", "Meta Quest"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "5-YYva5AWHs": {
    overview: "This session walked through creating, customizing, and animating MetaHumans natively within Unreal Engine 5.8. Alex Coulombe demonstrated the in-engine MetaHuman Creator workflow, comparing cinematic and performance-optimized assembly configurations alongside hair card and groom setups. The class also covered real-time facial puppeteering using Live Link Hub with a standard webcam and generating MetaHuman Identities from footage and custom scans.",
    covered: [
      "Reviewing the evolution of MetaHumans from cloud-based tools to native in-engine creation in Unreal Engine 5.8.",
      "Sculpting facial geometry, breaking symmetry, and adjusting body proportions directly in the native MetaHuman editor.",
      "Customizing skin textures, teeth shaders, makeup, and hair color using hair cards and groom systems.",
      "Importing wardrobe assets from Fab, configuring full rigs, and assembling cinematic versus optimized character LODs.",
      "Evaluating assembled MetaHumans side by side in-engine using LOD coloration, wireframe views, and lighting adjustments.",
      "Driving real-time facial animation on multiple MetaHumans simultaneously through Live Link Hub using a webcam.",
      "Generating a MetaHuman Identity from multi-angle video frames and fitting facial and dental tracking markers.",
      "Testing custom mesh-to-MetaHuman conversion using RealityScan head geometry aligned with Unreal Engine modeling tools.",
    ],
    tools: ["Unreal Engine 5.8", "MetaHuman Creator", "Live Link Hub", "Fab", "Live Link Face", "RealityScan", "Modeling Tools", "Control Rig", "Level Blueprint"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "_1BvJC_He8Q": {
    overview: "This session walked through markerless motion capture workflows and virtual camera setup in Unreal Engine 5.8. Alex Coulombe demonstrated ingesting video and audio through Live Link Hub, processing markerless full-body and facial capture with MetaHuman Performance, and tracking virtual cameras with mobile VCam. The class also covered editing camera takes in Sequencer, blending animation assets, and processing depth-based facial recordings.",
    covered: [
      "Comparing standalone Live Link Hub broadcasting with in-engine Live Link connections across shared MetaHuman skeletons.",
      "Driving real-time facial animation from webcam tracking and audio input with customizable mood parameters.",
      "Ingesting monocular full-body video into Live Link Hub and configuring MetaHuman Performance tracking settings.",
      "Connecting the mobile Unreal VCam app and troubleshooting Take Recorder timecode rollover recording issues.",
      "Exporting processed markerless body animations and applying them across stylized MetaHumans and mannequin meshes.",
      "Adjusting Sequencer camera settings, depth of field focus tracking, and overriding facial animation tracks.",
      "Posing MetaHumans using Control Rig and blending locomotion animations directly on the Sequencer timeline.",
      "Capturing TrueDepth facial performance footage on mobile and importing it via Live Link Hub ingest.",
      "Generating a MetaHuman Identity and solving depth-based facial animation using MetaHuman Performance.",
    ],
    tools: ["Unreal Engine 5.8", "Live Link Hub", "MetaHuman Performance", "MetaHuman Identity", "Unreal VCam", "Take Recorder", "Level Sequencer", "Live Link Face", "Control Rig", "Pixel Streaming"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "0UXNnU7NR80": {
    overview: "This session explored Unreal Engine's Procedural Content Generation (PCG) framework and its integration with external AI tools using the Model Context Protocol (MCP). Alex Coulombe demonstrated how to configure the MCP server to let AI assistants create PCG graphs and assemble environments inside the editor. He then covered PCG fundamentals by building procedural graphs from scratch to scatter assets, randomize transforms, and carve out paths with splines.",
    covered: [
      "Connecting Unreal Engine 5.8 to external AI assistants using the UnrealMCP plugin and local server configuration.",
      "Prompting Codex via MCP to autonomously author a functional PCG graph with custom assets and materials.",
      "Structuring agent markdown files and markdown knowledge bases to maintain workflow memory across AI sessions.",
      "Analyzing AI-generated PCG graph networks, debugging coordinate space issues, and cycling deterministic seed values.",
      "Setting up a PCG Volume, sampling landscape data, and configuring debug visualization modes in the viewport.",
      "Spawning trees and foliage using the Static Mesh Spawner and Hierarchical Instanced Static Meshes.",
      "Randomizing scale, rotation, and offsets with the Transform Points node to correct slope alignment.",
      "Branching graphs to scatter multiple weighted assets, including rocks and bushes, across distinct layers.",
      "Clearing procedural foliage along a spline path using spline sampling, Runtime Virtual Textures, and Difference nodes.",
    ],
    tools: ["Unreal Engine 5.8", "Procedural Content Generation (PCG) Framework", "Model Context Protocol (UnrealMCP)", "Codex", "Runtime Virtual Texture (RVT)", "Hierarchical Instanced Static Meshes (HISM)", "Obsidian", "Cassini Sample", "Spline Components"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "QA_W9QvvIcU": {
    overview: "This session translated fundamental Unity concepts, workflows, and terminology into Unreal Engine. Whitt Sellers demonstrated how to adapt editor layouts, build interactive Actor Blueprints, configure parameterized materials, and migrate assets using FBX. The class also covered setting up the Virtual Reality template and driving character state machines with Animation Blueprints.",
    covered: [
      "Mapping core Unity concepts, terms, and interface panels to their Unreal Engine equivalents.",
      "Customizing Unreal editor layouts to match standard Unity workspace arrangements.",
      "Creating an Actor Blueprint with components and scripting rotation toggles via node-based input logic.",
      "Setting up a base material with parameters and generating lightweight Material Instances.",
      "Adding the Virtual Reality Template feature pack and testing with OpenXR and VR Preview.",
      "Exporting static and animated assets from Unity via FBX and importing them into Unreal.",
      "Adjusting rotation offsets during FBX reimport to correct coordinate axis differences between engines.",
      "Building an Animation Blueprint with state machines, transitions, and boolean logic for character dancing.",
      "Casting to character animation instances inside the Level Blueprint to trigger runtime state changes.",
    ],
    tools: ["Unreal Engine", "Blueprints", "Animation Blueprints", "Material Instances", "VR Template", "OpenXR", "SteamVR", "FBX Exporter"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "96fazT0OFO4": {
    overview: "This session walked through building augmented reality applications in Unreal Engine using the Handheld AR template for Android and iOS. Yu-Jun Yeh covered SDK setup, provisioning, packaging requirements, and common version compatibility pitfalls across modern engine releases. The class demonstrated extending the default template with custom UI controls, plane-detection spawning, and multi-target image tracking.",
    covered: [
      "Configured Android and iOS development environments, SDK and NDK versions, and device developer modes.",
      "Reviewed engine version compatibility, packaging workflows, and Vulkan versus OpenGL requirements across Unreal releases.",
      "Explored the Handheld AR template structure across game modes, AR pawns, and UI widgets.",
      "Inspected runtime plane detection, hit testing, and gesture manipulation for spawned placeable actors.",
      "Added custom UMG interface buttons to toggle actor visibility and cycle dynamic material colors.",
      "Constructed an isolated test level with lighting and mouse cursor controls to debug Blueprint logic.",
      "Deployed interactive modifications directly to a connected Android tablet using engine Quick Launch.",
      "Created AR Candidate Image data assets and configured simultaneous tracking within AR Session Config.",
      "Scripted runtime geometry detection to spawn actors aligned to tracked physical reference images.",
    ],
    tools: ["Unreal Engine 5.8", "Handheld AR Template", "ARKit", "ARCore", "Android Studio", "Xcode", "UMG", "Blueprints", "SideQuest", "iTunes"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "0WXmDuocXzc": {
    overview: "Alex Coulombe walked through setting up real-time cloth physics in Unreal Engine from static mesh assets. The session explored mesh subdivision, clothing data painting, wind actors, and time dilation adjustments to achieve gentle billowy motion. Coulombe also troubleshot simulation recording workflows using Take Recorder and Chaos Caching.",
    covered: [
      "Subdividing mesh geometry using Modeling Mode tools to provide adequate vertices for bending during simulation.",
      "Converting static meshes to skeletal meshes to generate clothing data and configure physics.",
      "Painting cloth weights with variable brush values to establish anchored areas and flexible zones.",
      "Applying clothing data and configuring directional wind sources, wind speed, and randomized gusts.",
      "Modifying world gravity settings and physics damping to produce slower, softer fabric movement.",
      "Scripting Blueprint inputs to control global time dilation dynamically during live simulation.",
      "Testing Take Recorder workflows with cloth actors and a ragdoll mannequin skeletal mesh.",
      "Enabling the Chaos Caching plugin and configuring the Chaos Cache Manager to record simulation data.",
    ],
    tools: ["Skeletal Mesh Editor", "Cloth Paint", "Modeling Tools", "Wind Directional Source", "Blueprints", "Global Time Dilation", "Take Recorder", "Chaos Caching", "Level Sequence"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "Gzzhtygszlc": {
    overview: "In this office hours session, Alex Coulombe explored techniques for creating interactive swinging cables and vines in Unreal Engine for VR experiences. The discussion covered collision filtering, procedural segment colliders, and player attachment logic using Blueprints. Coulombe tested the cable physics implementation directly in a VR headset to evaluate motion smoothness and comfort.",
    covered: [
      "Setting up the default Cable Actor and exploring native physics parameters and elasticity.",
      "Attaching cable ends dynamically to reference actors and skeletal mesh components using sockets.",
      "Enabling cable collision and adjusting segment count and solver iterations for visual fidelity.",
      "Prototyping Blueprint overlap logic to detect proximity and bind cable attachment to player hands.",
      "Generating dynamic sphere colliders across cable segments using particle locations for grabbing along the length.",
      "Configuring custom collision channels and presets to prevent cables from self-colliding or triggering unwanted overlaps.",
      "Migrating test logic into the VR template and setting up hand collision spheres on the pawn.",
      "Parenting and updating player pawn position to cable endpoints using event tick and particle locations.",
      "Smoothing player swinging movement and reducing motion sickness using VInterp To and delta seconds.",
    ],
    tools: ["Unreal Engine", "Blueprint", "Cable Component", "VR Template", "OpenXR", "Meta Quest 3"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
  "ac8eSSs5ErE": {
    overview: "This session investigated controllerless hand tracking and gesture-based locomotion in Unreal Engine. Alex Coulombe troubleshot OpenXR hand tracking pipelines across Meta Quest Link, Virtual Desktop, and Steam Link streaming environments. The class concluded with a breakdown of custom Blueprint logic for tracking hand joints, detecting gestures via bone distance thresholds, and driving player movement.",
    covered: [
      "Investigating Meta XR Interaction Toolkit setup and plugin compatibility across Unreal Engine versions.",
      "Debugging OpenXR hand tracking detection using the Get Hand Tracking State Blueprint node.",
      "Troubleshooting PCVR streaming runtimes between SteamVR, Meta Quest Link, and Virtual Desktop.",
      "Testing sample projects and inspecting pawn Blueprints for controllerless hand mesh visualization.",
      "Verifying functional OpenXR hand tracking and grab interactions using Steam Link streaming.",
      "Structuring hand joint tracking using Instanced Static Meshes representing bone keypoints in Blueprints.",
      "Implementing bone distance thresholds on Event Tick to trigger custom gestures like pinching.",
      "Building controllerless locomotion logic that moves the player forward using an open-palm gesture vector.",
      "Comparing Steam Link OpenXR API layers and headset identification settings across client configurations.",
    ],
    tools: ["OpenXR", "Meta XR Interaction Toolkit", "SteamVR", "Steam Link", "Meta Quest Link", "Virtual Desktop", "Blueprints", "Instanced Static Mesh", "Meta Quest 3", "Galaxy XR"],
    source: "youtube-captions",
    generatedOn: "2026-10-06",
  },
};
