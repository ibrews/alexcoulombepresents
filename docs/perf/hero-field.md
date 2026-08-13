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

## `/lab`'s ParticleField — measured, and why the constellation did NOT ship there

Measured 2026-08-13 at 1440x900 (`app/lab/page.tsx`):

```
nav          y    0–64
field band   y  128–521   (1440 x 393 — the whole canvas)
h1           x  164–932   y 182–302
paragraph    x  164–836   y 326–443
next line    x  164–1276  y 459–479
field wrapper opacity: 0.5
```

There **is** free space — a 164px left margin running the full 393px height, and
a right region roughly x 950–1400 / y 182–443. So "no room" is not the reason.
Three concrete blockers are:

1. **The band is 393px tall, not 828px.** `heroSlots` is tuned for the homepage
   hero. Its `floor` band (`h - inset`, insets 46–83) would land at y 310–347
   here — directly on the h1 and paragraph. `/lab` needs its own slot set, not
   a reuse.
2. **The field wrapper is `opacity-50`.** Link dots, halos and labels would be
   washed to half strength — dimmer than the ambient dots on a page that is
   already busier. Hit-testing is unaffected, but discoverability (already the
   weak point of this feature) gets worse, not better.
3. **`ParticleField` takes no links today.** Wiring it means a lab-scoped pool,
   its own bounds measurement, and its own tests — the homepage's version of
   this took several rounds and shipped a real bug at 1024x800 that only
   measurement caught.

None of that is hard; it is just more than a measurement. The next session
should start from the numbers above rather than re-deriving them.

## Canvas paint cost — still open, and honestly so

Unchanged from above: `ctx.stroke()` per linked pair is unmeasured. It needs a
DevTools trace in a **visible** window — an undisplayed browser pane throttles
`requestAnimationFrame`, so any FPS sampled through one is a number nobody
should stand behind. Scripting is measured and fine (4–5% of a frame); this is
the only remaining unknown.
