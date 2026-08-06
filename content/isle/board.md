updated: 2026-08-05

## Venue Architecture
- Full venue (future, next funding round): 10,000+ sqft, up to ~200 concurrent players
- Hybrid layout: modular self-contained rooms (1-4 key archetypes) plus open, themed common regions
- Game-mechanic development effort concentrated in room modules; common areas carry lighter interactions
- Modules engineered around physical infrastructure needs: tracking, power, HVAC, fire code, doors
- Initial popup: much smaller, ~15-20 concurrent players, escape-room style -- open question whether it is a true miniature of the full venue or an assembly of modules with the progression system "skinned on" later

## Progression System
- An overarching meta-progression layered on top of room-based minigames -- the key differentiator versus venues like Level99, where rooms are individually scored with no meta layer
- Must control throughput: which groups access which rooms, and when
- Must support multiple discrete groups moving through the space at different times and paces
- Open question: how much the throughput system costs to build well enough to scale from popup to full venue -- build it in from day one, or defer and "skin it on" later?

## Interaction Capabilities
- Candidate mechanics for a fast, "vibe-codeable" early prototype: tracked physical props, shared aiming, grabbing or throwing, body-position zones, hand gestures, physics objects
- Goal: demonstrate quickly and reliably from Agile Lens's existing code base
- Not yet prioritized or finalized -- an early working wishlist
- Target ratio: roughly 60% digital / 40% physical (physical includes bodily movement, not just props) -- aiming to maximize physical touch while using passthrough to blend the themed environment with digital elements
- Technical approach: room-based re-anchoring per space instead of persistent global tracking, for cost efficiency. Floor-anchored props (predictable motion, trackable via IMU) are far easier than free-grab objects given current headset tracking limits -- expensive solutions like OptiTrack or Anti-Latency are not expected to be needed at the prototyping stage
- Throughput model reference: climbing-gym style timed entries releasing batches of players, with "routes" (multiple paths through a zone) shaping mechanics without heavy digital overhead

## Build Strategy
- Fabricate modular rooms offsite; assemble into the venue once it is locked in -- avoids paying full venue rent before the game exists
- Roughly 9 months lead time from locking a venue to a "very soft open"
- Modules designed to work just about anywhere -- minimum square footage plus tolerance for odd column placement is the only real site requirement
- Precedent: Agile Lens's "Ghosted" (a site-specific Magic Leap experience) -- fully mocked up in VR before the physical build
- Near-term test plan: a Boston space for early local tests, then relocation to New York for a fully-fabricated popup that can handle real volume

## Team and Studio Strategy
- Full-venue hiring plan (draft): CTO/lead architect, 2 networking/backend engineers, 2-3 XR gameplay engineers, 1 tracking/spatial engineer, 1-2 game/level designers, 3+ technical artists/UI/animation, a dedicated UX/experience designer (distinct from level design), 1 live-ops/tools engineer, 1 embedded/hardware engineer, at least 2 QA (multiplayer testing needs 2+ simultaneous testers)
- Venue operations (separate from the build team): roughly 1 floor warden per 5,000 sqft, 2 front-of-house staff, dedicated on-site show-control engineers
- Build vs. buy: keep proprietary and on-site work in-house; consider contracting a mixed-reality game studio for core game design if creative direction is clear -- a real cost-saving lever, though the specific new risks of that split are still an open question
- Constraint: because Isle is location-based, any outsourced studio needs to understand the physical space's limitations
- Agile Lens leans toward time-based billing over milestone contracts for R&D-heavy work like this
- Early creative-collaboration threads: American Repertory Theater (physical play development), a studio called Creature

## Partnerships
- Pico: NDA signed, Holodeck visit completed; an introduction to Pico's enterprise partnerships team has been requested to discuss a headset partnership for Isle's venues
- Meta: a parallel thread opened informally, not yet elaborated

## Fundraising
- Individual angel fundraising is progressing
- Larger syndicates and VCs have been a harder fit, given the broader XR capital-markets climate right now
