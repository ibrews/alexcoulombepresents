# Hero field performance profile

Date: 2026-08-13

## Status

**Scripting cost: measured, and it is a non-issue.** Canvas paint cost:
still unmeasured. Read the two sections below as separate findings — this is
not yet a full clean bill of health, but the O(n²) worry is answered.

## Intended method

Profile the production homepage at desktop size in Chrome DevTools Performance:

1. Record 10 seconds while the constellation is idle after the first 30
   seconds of page idle time (when the settling pass is enabled).
2. Record 10 seconds with one visible constellation node hovered.
3. Report median and worst frame time, FPS, and the canvas scripting share
   from each trace.

## Hardware and measurement block

Target machine: MacBook Pro (MacBookPro18,2), Apple M1 Max, 64 GB unified
memory, macOS 27.0, arm64.

The application could not be served locally: `next start --hostname 127.0.0.1`
was denied with `listen EPERM`. The available browser integration also reported
that no browser was connected. Consequently, idle frame time/FPS and hovered
frame time/FPS are **not measured** rather than estimated.

## Measured: per-frame scripting cost (2026-08-13)

Benchmarked by replaying `FaceField`'s exact per-frame JS — `LinkNodeLayer.update()`,
pointer repulsion, the 20 face attractors, damping/integration/wrapping, the settling
pass and the pair-linking pass — over 600 frames at the 320-particle cap, after 300
warm-up frames. Node 26 / V8, MacBook Pro M1 Max. **Canvas painting is excluded**; this
is the scripting half only.

| state | median | p95 | share of a 16.67ms frame |
|---|---|---|---|
| idle (one pair pass) | 0.69ms | 0.75ms | 4.2% |
| idle + settling (two pair passes) | 0.80ms | 0.84ms | 4.8% |
| hovered (ripple active) | 0.72ms | 0.80ms | 4.3% |
| hovered + settling | 0.83ms | 0.90ms | 5.0% |

**The O(n²) loops do not dominate, and there is nothing to optimize here.** 51,040 pairs
of cheap arithmetic costs well under a millisecond; the second (settling) pass adds ~0.1ms
and the whole ripple displacement pass adds ~0.03ms. Even allowing an order of magnitude
for a much slower machine, the scripting side stays inside the frame budget.

**What this does NOT cover:** `ctx.stroke()` per linked pair. That is the remaining
candidate for real cost, and it is a renderer question a browser trace has to answer —
see the intended method below. Do not conclude the hero is fast until that exists.

## Static workload accounting (not a timing measurement)

`FaceField` caps its ambient field at 320 particles. At that cap, its normal
particle-link loop evaluates 51,040 unordered particle pairs per frame
(`320 × 319 ÷ 2`). Once the 30-second idle threshold elapses, the settling
repulsion loop evaluates another 51,040 pairs per frame. A hovered link node
also makes `LinkNodeLayer` visit the particle array for reversible ripple and
bulge displacement; this is linear in particle count plus its small set of
active nodes/waves.

The pairwise loops are therefore the only O(n²) work and are the leading
candidate to dominate CPU time at the 320-particle cap. Canvas path creation
and stroking for nearby pairs can still be a material renderer cost, so that
conclusion remains a hypothesis until a browser trace attributes the frame.

## Recommendation

Do not optimize from this evidence. Capture the two traces above on the target
machine, then keep the implementation unchanged if both stay comfortably below
the 16.7 ms frame budget. If the traces identify the pairwise work as dominant,
evaluate a spatial grid for the link and settling neighbor searches; retain the
same visual distance thresholds before considering any particle-count change.

## `/lab`'s ParticleField — measured, then shipped (2026-08-13)

The constellation now runs on `/lab` too. The layout it was placed against,
measured off the running page:

```
                       1440x900          1024x800
nav bottom             y  64 (104 with the announcement banner live)
field band             y 128–521         y 128–521      (the whole canvas)
h1 block               x 164–932         x  20–788
lead paragraph         x 164–836         x  20–692
left gutter            164px             20px   ← the section's own padding
right gutter           508px             236px
```

Each of the three blockers this file used to list, and what closed it:

1. **The band is 393px tall, not 828px.** `/lab` got its own slot set rather
   than reusing `heroSlots` — `lib/labLinks.ts`. Side bands only: `top` spans
   the full width and `floor` is anchored to the band's bottom edge, so
   heroSlots' floor insets would have landed at y 310–347, on the headline.
2. **The field wrapper was `opacity-50`.** Removed. `ParticleField` now takes a
   `dim` prop and applies it per ambient dot in code, so the ambient field
   keeps exactly the strength it had while the link dots, halos and labels draw
   at full strength on the same canvas.
3. **`ParticleField` took no links.** It now measures its own bounds with
   `getBoundingClientRect` on a 400ms timer (not inside the RAF loop — under
   `prefers-reduced-motion` there is no RAF loop, which is how the homepage
   once stranded its top row under the nav), and `HeroBounds` gained
   `gutterLeft`/`gutterRight` so a band whose margin cannot hold a node is
   dropped rather than stacked onto the copy.

**What that yields:** 9 nodes at 1440 (4 left, 5 right), 5 at 1024 (right only
— a 20px margin has no honest home). Verified live at both sizes by measuring
every anchor's `getBoundingClientRect`, expanding each by `NODE_REACH` (58px:
30px drift budget + half of the largest hit-target) and asserting no overlap
with the nav, the h1, the lead paragraph, the viewport or the canvas clip. Zero
violations. `tests/lab-links.test.ts` replays the same two layouts through the
real `LinkNodeLayer` across 25 seeds.

**Two bugs measurement caught, both of which a screenshot would have passed:**

- `NODE_REACH` was first written as `WANDER_AMP + 28` = 54. Simulated, drift
  peaks at **27.2px**, not 26 — the home spring overshoots its wander target
  and the cursor dodge adds to that. Every hit-box in the tests was understated
  until the constant became `30 + 28`.
- On a window resize the nodes were left gliding home from their old positions.
  The home spring is overdamped enough that, measured, they crawl at roughly
  20px/second: dragging 1440 → 1024 parked the entire right strand off-screen
  and unclickable for several seconds. `resize()` now calls `snapToHomes()`.
  **The homepage hero had the same shape of issue** — fixed since, in `b1c7c31`,
  after measuring it rather than assuming: `scripts/probe-hero-transients.mjs`
  put it at **1.65s off-screen** on a 1440 → 1024 resize (right edge 1361
  against a 1024 viewport) and, separately, **2.28s with a hit-target under the
  nav** when the announcement banner slides the header 64 → 104 after mount.
  The hero's `syncBounds()` now snaps on any measured bounds change, which
  covers the banner, the resize and the breakpoint that hides the cutout from
  one place. Verified live: nodes under the nav 4 → 0 at 1440x900, off-screen
  3 → 0 after resizing to 1024x800.

## Canvas paint cost — still open, and honestly so

Unchanged from above: `ctx.stroke()` per linked pair is unmeasured. It needs a
DevTools trace in a **visible** window — an undisplayed browser pane throttles
`requestAnimationFrame`, so any FPS sampled through one is a number nobody
should stand behind. Scripting is measured and fine (4–5% of a frame); this is
the only remaining unknown.
