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
  generateHeroShape,
  type FormData,
  type HeroShapeKey,
} from "@/lib/heroShapes";
import { HERO_APPROACH_DIR, parseSplatBuffer } from "@/lib/parseSplat";

const ASSET_URL = "/hero.splat";

type FormKey = "splat" | HeroShapeKey;
const FORM_ORDER: FormKey[] = ["splat", ...HERO_SHAPE_ORDER];

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

// Backdrop opacity once settled — low enough that the h1/portrait stay
// crisp, high enough that the morph is still worth watching. Tune here.
const BACKDROP_OPACITY = 0.5;

export default function SplatHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAsset, setHasAsset] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const advanceRef = useRef<(() => void) | null>(null);

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
      scene.add(group);

      geometry = new THREE.BufferGeometry();
      const positionAttr = new THREE.BufferAttribute(parsed.pos.slice(), 3).setUsage(THREE.DynamicDrawUsage);
      const colorAttr = new THREE.BufferAttribute(parsed.col.slice(), 3).setUsage(THREE.DynamicDrawUsage);
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
      const formCache = new Map<FormKey, FormData>([["splat", { pos: parsed.pos, col: parsed.col }]]);
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
      const targetPos = parsed.pos.slice();
      const targetCol = parsed.col.slice();

      const advance = () => {
        formIndex = (formIndex + 1) % FORM_ORDER.length;
        const data = getFormData(FORM_ORDER[formIndex]);
        targetPos.set(data.pos);
        targetCol.set(data.col);
        morphT = 0;
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
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, clock.getDelta());

        group.rotation.y += dt * 0.045; // slow, subtle drift

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

  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      <div
        ref={containerRef}
        onClick={() => advanceRef.current?.()}
        className={`pointer-events-auto absolute inset-0 transition-opacity duration-700 ${
          active && ready ? "" : "opacity-0"
        } ${!reducedMotion ? "cursor-pointer" : ""}`}
        // Tailwind can't generate an arbitrary-value opacity class from a
        // runtime template literal (its scanner needs a static string), so
        // the "on" opacity is set inline; the "off" state above stays a
        // plain Tailwind class. Both animate via the same transition-opacity.
        style={active && ready ? { opacity: BACKDROP_OPACITY } : undefined}
      />
      {active && ready && (
        // z-20: escapes the section's z-index:auto stacking bucket (shared
        // with the portrait and headline) so this caption stays legible
        // even where it falls over the portrait's bounding box.
        <p className="pointer-events-none absolute bottom-4 right-4 z-20 font-mono text-xs text-mist">
          {reducedMotion ? "a real 3D capture" : "click to reshape · a real 3D capture"}
        </p>
      )}
    </div>
  );
}
