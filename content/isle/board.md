updated: 2026-08-09

## Venue Architecture
- Current premise: guests bring a film world to life on a themed soundstage, must resolve the chaos
- Flow: themed queue -> gateway modules (teach core interactions) -> magical transition -> main venue zones (forest, palace, underground, town) -> judgment scene -> reentry w/ takeaway
- Full venue: 10k+ sqft, ~200 players; modular rooms + open themed regions
- Popup: 15-20 players, escape-room scale
- "Augmentation first": scenic backdrops as reliable base, AR/MR adds depth on top
- Aesthetic idea: unifying tactile look (Rec Room-style); cardboard "brown boxing" prototype look
- Open Q: mini full-venue, or modules first?

## Mechanics & Narrative
- Lead candidate: **body jumping** -- pilot/hop between avatars, "actors have become puppets"
- Co-located = third-person puppeteering (keeps spatial sense, less freedom); fully virtual = full embodiment (can fly, breaks real-world anchor)
- Likely one body-jumping role per group -- higher cognitive load
- Also explored: apple-throw/time-manipulation co-op, classic theater games (energy ball, zip-zap-zop) w/ VR twists, rescale/clone/slow-time as VR-unique moves
- Demo candidates: Alchemist's Workbench (potion mixing), MR boss battle/stealth
- Design intent: score/difficulty-based repeatability over one-off puzzles (low replay value)

## Progression System
- Meta-progression layered over room minigames
- Differentiator vs. Level99 (no meta layer there)
- Controls throughput: who gets which room, when
- Handles multiple groups, staggered entry
- Open Q: build throughput system now, or later?

## Reality Modes & Interaction
- Precise defs: MR = passthrough + digital overlay; spatial skinning = real world transformed, physical objects still engaged; full VR = "space multiplication" via brief travel sequences
- Limitation: same real object in multiple "rooms" reads as obviously the same space
- Ideas: redirected walking (same rooms, different skins); physical set changes between visits; mechanical-pulley modules that self-swap elements
- Wishlist: tracked props, shared aiming, grab/throw, body-position zones, hand gestures, physics objects
- ~60% digital / 40% physical target ratio
- Room-based re-anchoring, not persistent tracking; floor-anchored props >> free-grab

## Tech & Tracking
- Options: OptiTrack (precise, camera-heavy, costly) vs. Pico room mapping (offline, shareable -- preferred) vs. Meta spatial anchors (server-ping reliability issues)
- Don't chase perfect tracking -- design around the constraint instead
- Stage Presence already has: co-location, avatar switching, grab/scale/throw physics, lightweight player-outline capsules, controller-as-object-tracker
- Full body avatars don't scale well past a handful of concurrent custom characters in Unreal

## Build Strategy
- Fab modules offsite, assemble once venue's locked
- ~9mo lock-to-soft-open lead time
- Modules work anywhere: min sqft + column tolerance
- Precedent: "Ghosted" (Magic Leap, VR-mocked first)
- Prototyping: Phase 1 = tables/chairs/found objects only ("parallel dimension" framing); Phase 2 = real set pieces once mechanics validate
- Next: Boston tests, then NY popup
- Scaling caution: don't over-scale the first demo (Christmas Carol lesson) -- small and proven beats big and shaky

## Team and Studio Strategy
- Full team: CTO, 2x backend, 2-3x XR gameplay, tracking, design, UX, 3+ tech art, live-ops, hardware, 2+ QA
- Venue ops: 1 warden/5k sqft, 2 FOH, show-control
- Build core in-house, maybe outsource game design
- Constraint: outside studio must know the physical space
- Candidate studio: Brains Immersive (Prague, theatrical MR work)
- Time-based billing > milestones for R&D

## Partnerships
- Pico: NDA signed, Holodeck visit done
- Requested intro to Pico enterprise partnerships
- Meta: informal thread opened

## Fundraising
- Angel round progressing
- Larger VC/syndicates: harder fit (XR capital climate)
