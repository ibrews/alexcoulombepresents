# Hero field performance profile

Date: 2026-08-13

## Status

No browser frame-time or FPS result is available from this run. Do not treat
this document as a clean bill of health: the required browser trace could not
be captured in this sandbox.

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
