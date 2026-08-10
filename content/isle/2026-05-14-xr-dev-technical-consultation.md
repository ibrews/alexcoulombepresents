title: XR dev technical consultation -- tracking, co-location, cost model
date: 2026-05-14
summary: Deep technical dive on tracking hardware options, co-location, and how development cost breaks down.

## Notes

- Tracking options compared: OptiTrack (millimeter-precise, camera-heavy, wall/room limits) vs. Pico room mapping (offline, shareable device-to-device) vs. Meta spatial anchors (needs server pings, reliability issues)
- Guidance: don't chase perfect tracking -- lean into technical constraints creatively instead
- Cost scales with three things: number of environments, number of characters, number of mechanics -- mechanics are usually the biggest driver since most end up room-specific
- Co-location framed as a solved problem in game dev -- the real challenge is calibration, which got much easier around 2022
- Passthrough cutout-capsule approach (from the Royal Shakespeare Company project): shows general physical presence without detailed per-limb tracking, highly performant
- Demo structure recommendation: 4-person group, 3 prep mini-challenges building to one combined final challenge -- naturally replayable and socially stretches session length
- Physical/digital balance: on-site staff nudging a prop between sessions can replace a lot of dynamic-difficulty software (Level99's "walk the plank" tightens purely mechanically over a session, no staff needed)
- Standalone (not PC/Link) recommended for cost and complexity, even at some fidelity cost
