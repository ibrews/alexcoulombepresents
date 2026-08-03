/*
 * SplatHero — a full-bleed, morphing point-cloud backdrop for the homepage
 * hero. It renders BEHIND the headline text and behind FaceField's portrait
 * cutout (see the z-stacking note in app/page.tsx and the pointer-events
 * note in components/FaceField.tsx) — it's a decorative backdrop, never a
 * layer that has to be dodged.
 *
 * ARCHITECTURE
 * ------------
 * This does NOT use @mkkellogg/gaussian-splats-3d (the earlier version of
 * this component did). True Gaussian-splat rendering can't morph its
 * internal buffers cleanly — so instead we hand-parse the raw .splat file
 * ourselves (lib/parseSplat.ts) into a plain position/color point cloud and
 * render it as a THREE.Points cloud. That point cloud can morph: on a click
 * or a timer, it dissolves from the splat capture into one of a few
 * procedural shapes (lib/heroShapes.ts — a wave, a globe, a skyline) and
 * back, lerping every point's position AND color in lockstep because every
 * form is resampled to the exact same point count.
 *
 * This trades away multi-format support (the old viewer also accepted
 * .ksplat/.ply) for morphability — only the antimatter15 .splat format is
 * understood here. See lib/parseSplat.ts for the format layout.
 *
 * HOW TO ACTIVATE
 * ----------------
 * Drop `public/hero.splat` in place — no code change needed. This component
 * probes for it at runtime (HEAD request) and quietly does nothing if it's
 * absent.
 *
 * CAPTURING A SPLAT
 * ------------------
 *   - Scaniverse (iOS, free)  → Export → "Gaussian Splat" → save as hero.splat
 *   - Luma AI (iOS / web)     → Export → .ply, then convert to .splat
 *   - Polycam (iOS)           → "Gaussian Splat" capture mode → .ply, convert
 *
 * SIZE BUDGET
 * ------------
 * Keep the exported file under 15MB (ideally 3-8MB) — it downloads on every
 * desktop visit once dropped in.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  HERO_POINT_COUNT,
  HERO_SHAPE_ORDER,
  HERO_SHAPE_LABELS,
  generateHeroShape,
  type FormData,
  type HeroShapeKey,
} from "@/lib/heroShapes";
import { pulseHeroConstellation } from "@/lib/heroPulse";
import { HERO_APPROACH_DIR, parseSplatBuffer } from "@/lib/parseSplat";

const ASSET_URL = "/hero.splat";

type FormKey = "splat" | HeroShapeKey;
// "splat" (the raw capture) is deliberately excluded from the visible
// cycle — see the currentForm comment below. It stays a valid FormKey so
// formCache can still hold it as morph-target backing data.
const FORM_ORDER: FormKey[] = [...HERO_SHAPE_ORDER];

// Timer cadence. Alex: "I don't want a single splat to linger for too long
// — swap every 10 seconds." Held at a flat 10s rather than a random band so
// the rhythm is predictable: nothing on the homepage sits still long enough
// to read as a static image.
const CYCLE_MS = 10000;

// Morph rate — ported directly from the easteregg reference's main loop:
// morphT approaches 1 at this rate (per second), and the per-frame lerp
// factor eases in as morphT climbs so the settle feels like it's arriving
// rather than linearly sliding.
const MORPH_RATE = 0.55;

// Point size in CSS pixels at the camera's framing distance (see
// frameCamera below) — small and splat-like, not a chunky sprite.
const BASE_POINT_PX = 2.4;

// How generously the camera pulls back from the cloud's measured radius.
// >1 gives every form breathing room even though shapes aren't an exact
// match for the splat's measured bounding sphere.
const FRAMING_PADDING = 1.7;

// Screen-space nudge (CSS px equivalent, applied via camera.setViewOffset —
// NOT a world-space offset) so the cloud sits lower and further right than
// dead-center, clearing the h1/paragraph text better and reading as
// deliberately off-center rather than centered-and-clipped.
const SCREEN_SHIFT_X = 0.14; // fraction of container width, + = shift content right
const SCREEN_SHIFT_Y = 0.16; // fraction of container height, + = shift content down

// Compose the visual weight in the lower half of the hero. The parent hero
// section clips this canvas, so its bottom edge is also the marquee cutoff.
const CLOUD_VERTICAL_OFFSET_FACTOR = -0.24;

// Backdrop opacity once settled — low enough that the h1/portrait stay
// crisp, high enough that the morph is still worth watching. Tune here.
//
// Raised from 0.5: at half opacity a dark interior capture over this
// near-black hero was indistinguishable from FaceField's ambient particles —
// Alex looked straight at a working build and reported seeing no splats at
// all. The point cloud has to read as a distinct object, not as dust.
const BACKDROP_OPACITY = 0.85;

const ROTATE_SENSITIVITY = 0.006;
const VERTICAL_ROTATE_SENSITIVITY = 0.003;
const DRAG_START_DISTANCE_PX = 8;
const CLICK_DISTANCE_PX = 6;
const HORIZONTAL_DRAG_RATIO = 1.3;
const AUTO_ROTATE_RESUME_MS = 180;
const MAX_FLING_VELOCITY = 6;
const FLING_FRICTION = 2.6;
const FLING_EPSILON = 0.02;

type PointerState = {
  pointerId: number | null;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  isRotating: boolean;
  ignoreAsScroll: boolean;
};

const EMPTY_POINTER_STATE: PointerState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  isRotating: false,
  ignoreAsScroll: false,
};

export default function SplatHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAsset, setHasAsset] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // Never starts on "splat" (the raw capture, "A Real 3D Capture") — Alex:
  // it reads oddly on the homepage. It stays a valid FormKey and cached
  // form (below) purely as morph-target backing data; HERO_SHAPE_ORDER[0]
  // is what's actually shown and cycled from.
  const [currentForm, setCurrentForm] = useState<FormKey>(HERO_SHAPE_ORDER[0]);
  const advanceRef = useRef<(() => void) | null>(null);
  const rotateRef = useRef<((deltaX: number, deltaY: number) => void) | null>(null);
  const setDraggingRef = useRef<((isDragging: boolean) => void) | null>(null);
  const pointerStateRef = useRef<PointerState>(EMPTY_POINTER_STATE);

  // Track prefers-reduced-motion live (not just at mount) — cheap, and
  // means a mid-session OS setting change is respected without a reload.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Probe for the asset once, on mount. No asset → stays false forever and
  // the component never renders anything beyond `null`.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(ASSET_URL, { method: "HEAD", cache: "no-store" });
        if (!cancelled && res.ok) setHasAsset(true);
      } catch {
        // Network hiccup / dev-server quirk — stays inactive.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Desktop + fine-pointer only, and only once the browser is idle — this
  // is a decorative extra, never something worth delaying paint or
  // competing with real interaction for. Reduced motion does NOT skip
  // activation here: it still mounts, just statically (see the effect
  // below) rather than not rendering at all.
  useEffect(() => {
    if (!hasAsset) return;

    const isDesktop = window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
    if (!isDesktop) return;

    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const activate = () => setActive(true);

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(activate, { timeout: 4000 });
      // requestIdleCallback never fires while the tab is hidden, so a visitor
      // who opens the site in a background tab would land on an inert hero the
      // moment they switch to it. Belt-and-braces timeout so activation still
      // happens shortly after the tab becomes visible.
      timeoutHandle = setTimeout(activate, 4500);
    } else {
      timeoutHandle = setTimeout(activate, 1500);
    }

    return () => {
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [hasAsset]);

  // Mount the three.js point cloud once activated.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let renderer: import("three").WebGLRenderer | undefined;
    let geometry: import("three").BufferGeometry | undefined;
    let material: import("three").ShaderMaterial | undefined;
    let raf = 0;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      // three.js is dynamically imported (kept out of the server bundle and
      // out of the initial client bundle — this whole effect only ever runs
      // once activated, on desktop, after idle).
      const [THREE, res] = await Promise.all([import("three"), fetch(ASSET_URL)]);
      if (disposed || !container) return;
      if (!res.ok) {
        console.warn("[SplatHero] asset fetch failed:", res.status);
        return;
      }
      const buffer = await res.arrayBuffer();
      if (disposed) return;

      const parsed = parseSplatBuffer(buffer);
      if (disposed || !parsed) {
        console.warn("[SplatHero] failed to parse .splat asset (bad file, or too few splats survived the alpha filter)");
        return;
      }

      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);

      const group = new THREE.Group();
      group.position.y = parsed.radius * CLOUD_VERTICAL_OFFSET_FACTOR;
      scene.add(group);

      // Seeded from the first procedural shape, not the raw parsed.pos/col —
      // the raw capture ("A Real 3D Capture"/"splat") never gets painted,
      // not even for one frame before the first morph. parsed.radius still
      // drives camera framing and every shape's scale below.
      const initialShape = generateHeroShape(HERO_SHAPE_ORDER[0], parsed.radius);
      geometry = new THREE.BufferGeometry();
      const positionAttr = new THREE.BufferAttribute(initialShape.pos.slice(), 3).setUsage(THREE.DynamicDrawUsage);
      const colorAttr = new THREE.BufferAttribute(initialShape.col.slice(), 3).setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("position", positionAttr);
      geometry.setAttribute("color", colorAttr);

      material = new THREE.ShaderMaterial({
        uniforms: { uSize: { value: 1 } },
        vertexShader: [
          "attribute vec3 color;",
          "varying vec3 vColor;",
          "uniform float uSize;",
          "void main() {",
          "  vColor = color;",
          "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
          "  gl_PointSize = clamp(uSize / -mv.z, 1.0, 36.0);",
          "  gl_Position = projectionMatrix * mv;",
          "}",
        ].join("\n"),
        fragmentShader: [
          "varying vec3 vColor;",
          "void main() {",
          "  vec2 uv = (gl_PointCoord - 0.5) * 2.0;",
          "  float d = dot(uv, uv);",
          "  if (d > 1.0) discard;",
          "  float a = 1.0 - d;",
          "  a *= a;",
          "  gl_FragColor = vec4(vColor, a);",
          "}",
        ].join("\n"),
        // Normal (not additive) blending, WITH depth test/write: a single
        // THREE.Points draw call has no per-point depth sort, so additive
        // blending (verified against a headless rasterizer during
        // development) makes any moderately dense form — the globe's
        // spherical shell, the skyline's towers — accumulate front-and-back
        // overlap into a blown-out white blob, losing the palette entirely.
        // Depth test/write gives correct per-pixel occlusion (nearer points
        // win) regardless of draw order, which is what makes the globe read
        // as a sphere instead of a glowing disc.
        transparent: true,
        depthTest: true,
        depthWrite: true,
        blending: THREE.NormalBlending,
      });

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      group.add(points);

      // Approach direction is pre-rotated (see lib/parseSplat.ts) to match
      // this capture's up-aligned frame, so a plain Y-up camera works.
      const approachDir = new THREE.Vector3(...HERO_APPROACH_DIR).normalize();

      function frameCamera(w: number, h: number) {
        const aspect = w / h;
        camera.aspect = aspect;
        const vFov = (camera.fov * Math.PI) / 180;
        const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
        const limitingHalf = Math.min(vFov, hFov) / 2;
        const distance = (parsed!.radius / Math.tan(limitingHalf)) * FRAMING_PADDING;
        camera.position.copy(approachDir).multiplyScalar(-distance);
        camera.near = Math.max(0.01, distance * 0.02);
        camera.far = distance * 8;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        camera.clearViewOffset();
        // Three.js treats x/y as the sub-view's top-left corner in the full
        // frustum. Moving that window up-left makes the world appear down-right.
        camera.setViewOffset(w, h, -w * SCREEN_SHIFT_X, -h * SCREEN_SHIFT_Y, w, h);
        material!.uniforms.uSize.value = BASE_POINT_PX * distance * pixelRatio;
      }
      frameCamera(width, height);

      resizeObserver = new ResizeObserver(() => {
        if (!container) return;
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer!.setSize(w, h, false);
        frameCamera(w, h);
        if (reducedMotion) renderer!.render(scene, camera);
      });
      resizeObserver.observe(container);

      renderer.render(scene, camera);
      if (!disposed) setReady(true);

      if (reducedMotion) {
        // "ideally just render the splat statically" — no cycling, no
        // click-to-advance, no drift, no morph animation. advanceRef stays
        // null, so the container's onClick is a no-op.
        return;
      }

      // ---- Animated behavior: drift, morph, click/timer cycling ----
      const formCache = new Map<FormKey, FormData>([
        ["splat", { pos: parsed.pos, col: parsed.col }],
        [HERO_SHAPE_ORDER[0], initialShape],
      ]);
      const getFormData = (key: FormKey): FormData => {
        let data = formCache.get(key);
        if (!data) {
          data = generateHeroShape(key as HeroShapeKey, parsed!.radius);
          formCache.set(key, data);
        }
        return data;
      };

      let formIndex = 0;
      let morphT = 1;
      const targetPos = initialShape.pos.slice();
      const targetCol = initialShape.col.slice();

      const advance = () => {
        formIndex = (formIndex + 1) % FORM_ORDER.length;
        const form = FORM_ORDER[formIndex];
        const data = getFormData(form);
        targetPos.set(data.pos);
        targetCol.set(data.col);
        morphT = 0;
        setCurrentForm(form);
        pulseHeroConstellation();
      };
      const scheduleNext = () => {
        timeoutHandle = setTimeout(() => {
          advance();
          scheduleNext();
        }, CYCLE_MS);
      };
      advanceRef.current = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        advance();
        scheduleNext();
      };
      scheduleNext();

      const clock = new THREE.Clock();
      let isDragging = false;
      let velY = 0;
      let velX = 0;
      let lastMoveAt = 0;
      let autoRotateResumeStartedAt = 0;
      rotateRef.current = (deltaX, deltaY) => {
        group.rotation.y += deltaX * ROTATE_SENSITIVITY;
        group.rotation.x = THREE.MathUtils.clamp(
          group.rotation.x - deltaY * VERTICAL_ROTATE_SENSITIVITY,
          -1.3,
          1.3,
        );

        const now = performance.now();
        const dt = lastMoveAt ? Math.max(0.001, (now - lastMoveAt) / 1000) : 1 / 60;
        lastMoveAt = now;
        const instVelY = (deltaX * ROTATE_SENSITIVITY) / dt;
        const instVelX = (-deltaY * VERTICAL_ROTATE_SENSITIVITY) / dt;
        const EMA = 0.35;
        velY += (
          THREE.MathUtils.clamp(instVelY, -MAX_FLING_VELOCITY, MAX_FLING_VELOCITY) - velY
        ) * EMA;
        velX += (
          THREE.MathUtils.clamp(instVelX, -MAX_FLING_VELOCITY, MAX_FLING_VELOCITY) - velX
        ) * EMA;
      };
      setDraggingRef.current = (nextIsDragging) => {
        isDragging = nextIsDragging;
        if (nextIsDragging) {
          velX = 0;
          velY = 0;
          lastMoveAt = 0;
        } else {
          autoRotateResumeStartedAt = performance.now();
        }
      };

      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, clock.getDelta());

        if (!isDragging) {
          const flinging = Math.abs(velX) > FLING_EPSILON || Math.abs(velY) > FLING_EPSILON;
          if (flinging) {
            group.rotation.y += velY * dt;
            group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velX * dt, -1.3, 1.3);
            const decay = Math.exp(-dt * FLING_FRICTION);
            velX *= decay;
            velY *= decay;
            autoRotateResumeStartedAt = performance.now();
          } else {
            const resumeProgress = autoRotateResumeStartedAt
              ? Math.min(1, (performance.now() - autoRotateResumeStartedAt) / AUTO_ROTATE_RESUME_MS)
              : 1;
            group.rotation.y += dt * 0.045 * resumeProgress; // slow, subtle drift
          }
        }

        if (morphT < 1) {
          morphT = Math.min(1, morphT + dt * MORPH_RATE);
          const ease = 1 - Math.exp(-dt * (3.4 + morphT * 2.2));
          const pArr = positionAttr.array as Float32Array;
          const cArr = colorAttr.array as Float32Array;
          for (let i = 0; i < HERO_POINT_COUNT * 3; i++) {
            pArr[i] += (targetPos[i] - pArr[i]) * ease;
            cArr[i] += (targetCol[i] - cArr[i]) * ease;
          }
          positionAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;
        }

        renderer!.render(scene, camera);
      };
      loop();
    })();

    return () => {
      disposed = true;
      advanceRef.current = null;
      rotateRef.current = null;
      setDraggingRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      resizeObserver?.disconnect();
      geometry?.dispose();
      material?.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.parentElement?.removeChild(renderer.domElement);
      }
    };
  }, [active, reducedMotion]);

  if (!hasAsset) return null;

  const releasePointer = (element: HTMLDivElement, pointerId: number) => {
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
  };

  const finishPointer = (pointerId: number, element: HTMLDivElement, shouldAdvance: boolean) => {
    const pointer = pointerStateRef.current;
    if (pointer.pointerId !== pointerId) return;

    releasePointer(element, pointerId);
    setDraggingRef.current?.(false);
    pointerStateRef.current = EMPTY_POINTER_STATE;
    if (shouldAdvance) advanceRef.current?.();
  };

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      <div
        ref={containerRef}
        onPointerDown={(event) => {
          if (reducedMotion || !rotateRef.current) return;

          event.currentTarget.setPointerCapture(event.pointerId);
          pointerStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            isRotating: false,
            ignoreAsScroll: false,
          };
        }}
        onPointerMove={(event) => {
          const pointer = pointerStateRef.current;
          if (reducedMotion || pointer.pointerId !== event.pointerId || pointer.ignoreAsScroll) return;

          const totalX = event.clientX - pointer.startX;
          const totalY = event.clientY - pointer.startY;
          const totalDistance = Math.hypot(totalX, totalY);

          if (!pointer.isRotating) {
            if (totalDistance < DRAG_START_DISTANCE_PX) return;
            if (
              event.pointerType === "touch" &&
              Math.abs(totalX) <= Math.abs(totalY) * HORIZONTAL_DRAG_RATIO
            ) {
              // Leave a vertical swipe entirely to the browser's pan-y behavior.
              pointer.ignoreAsScroll = true;
              return;
            }

            pointer.isRotating = true;
            setDraggingRef.current?.(true);
          }

          event.preventDefault();
          rotateRef.current?.(event.clientX - pointer.lastX, event.clientY - pointer.lastY);
          pointer.lastX = event.clientX;
          pointer.lastY = event.clientY;
        }}
        onPointerUp={(event) => {
          const pointer = pointerStateRef.current;
          if (pointer.pointerId !== event.pointerId) return;

          const movement = Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY);
          finishPointer(event.pointerId, event.currentTarget, !pointer.isRotating && movement < CLICK_DISTANCE_PX);
        }}
        onPointerCancel={(event) => finishPointer(event.pointerId, event.currentTarget, false)}
        className={`pointer-events-auto absolute inset-0 select-none transition-opacity duration-700 ${
          active && ready ? "" : "opacity-0"
        } ${active && ready && !reducedMotion ? "cursor-grab active:cursor-grabbing" : ""}`}
        // Tailwind can't generate an arbitrary-value opacity class from a
        // runtime template literal (its scanner needs a static string), so
        // the "on" opacity is set inline; the "off" state above stays a
        // plain Tailwind class. Both animate via the same transition-opacity.
        style={active && ready ? { opacity: BACKDROP_OPACITY, touchAction: "pan-y" } : { touchAction: "pan-y" }}
      />
      {active && ready && (
        // z-20: escapes the section's z-index:auto stacking bucket (shared
        // with the portrait and headline) so this caption stays legible
        // even where it falls over the portrait's bounding box.
        <p className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-mono text-xs text-mist">
          {currentForm === "splat" ? "A Real 3D Capture" : HERO_SHAPE_LABELS[currentForm]}
          {!reducedMotion && " · click to reshape"}
        </p>
      )}
    </div>
  );
}
