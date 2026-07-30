/*
 * SplatHero — an optional, orbitable Gaussian Splat viewer for the homepage
 * hero. It overlays the same bottom-right footprint FaceField uses for the
 * photo cutout, so when it's active it visually replaces the photo; when
 * it's inactive (the common case, until you add an asset) it renders
 * nothing and the photo shows through untouched.
 *
 * HOW TO ACTIVATE
 * ----------------
 * Drop ONE splat asset into `public/` — no code change needed:
 *   public/hero.splat   (antimatter15 .splat format — preferred, fastest load)
 *   public/hero.ksplat  (Mark Kellogg's compressed format — also fast)
 *   public/hero.ply     (standard Gaussian Splatting .ply — slower to parse)
 *
 * This component probes for those files at runtime (HEAD request, in that
 * order) and quietly does nothing if none exist. Redeploy after adding the
 * file and the viewer activates automatically on desktop.
 *
 * CAPTURING A SPLAT
 * ------------------
 *   - Scaniverse (iOS, free)  → Export → "Gaussian Splat" → save as hero.splat
 *   - Luma AI (iOS / web)     → Export → .ply, or a converted .ksplat
 *   - Polycam (iOS)           → "Gaussian Splat" capture mode → .ply / .splat
 *
 * SIZE BUDGET
 * ------------
 * Keep the exported file under 15MB (ideally 3-8MB) — it downloads on every
 * desktop visit once dropped in. Crop tightly to the subject in the capture
 * app and reduce the splat/point count on export if it comes in oversized.
 */

"use client";

import { useEffect, useRef, useState } from "react";

const ASSET_CANDIDATES = ["/hero.splat", "/hero.ksplat", "/hero.ply"];

/*
 * Point the camera at whatever actually got loaded.
 *
 * Captures don't share a coordinate convention: a phone scan typically lands
 * its content several units down +Z (wherever the capture started), not
 * around the origin. A fixed initialCameraPosition/LookAt therefore aims at
 * empty space for most assets — the splat renders, but off-frame and tiny.
 * So we measure the scene we were actually given and fit to it, which keeps
 * "drop any file in public/ and it just works" true for the next capture too.
 *
 * Uses medians and a percentile radius rather than a raw bounding box:
 * splat scenes almost always carry a haze of stray low-opacity splats far
 * outside the subject, and min/max would frame those instead of the subject.
 */
function frameSceneToCamera(viewer: any, THREE: any) {
  const mesh = viewer?.getSplatMesh?.();
  const count = mesh?.getSplatCount?.() ?? 0;
  if (!count || typeof mesh.getSplatCenter !== "function") return;

  const v = new THREE.Vector3();
  const step = Math.max(1, Math.floor(count / 20000)); // sample, don't scan 380k
  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  for (let i = 0; i < count; i += step) {
    mesh.getSplatCenter(i, v, true);
    if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || !Number.isFinite(v.z)) continue;
    xs.push(v.x);
    ys.push(v.y);
    zs.push(v.z);
  }
  if (xs.length < 8) return;

  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const center = new THREE.Vector3(median(xs), median(ys), median(zs));

  // Radius that contains ~90% of the subject, ignoring the outlier haze.
  const dists = xs
    .map((_, i) => Math.hypot(xs[i] - center.x, ys[i] - center.y, zs[i] - center.z))
    .sort((a, b) => a - b);
  const radius = dists[Math.floor(dists.length * 0.9)] || 1;

  const camera = viewer.camera;
  const fov = ((camera?.fov ?? 65) * Math.PI) / 180;
  // Pull back far enough for the radius to fit the *vertical* fov, then a
  // little extra so the subject breathes inside a small hero panel.
  const distance = (radius / Math.tan(fov / 2)) * 1.5;

  // Approach slightly above and off-axis — a straight-on view of a scan
  // reads flat, and a raked angle shows it's genuinely volumetric.
  const dir = new THREE.Vector3(0.45, -0.28, -1).normalize();
  camera.position.copy(center).addScaledVector(dir, -distance);
  camera.near = Math.max(0.01, distance * 0.01);
  camera.far = distance * 12;
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  if (viewer.controls) {
    viewer.controls.target.copy(center);
    viewer.controls.minDistance = distance * 0.4;
    viewer.controls.maxDistance = distance * 2.5;
    viewer.controls.update();
  }
}

export default function SplatHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  // Probe for an asset once, on mount. No asset anywhere → stays null forever
  // and the component never renders anything beyond `null`.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of ASSET_CANDIDATES) {
        try {
          const res = await fetch(url, { method: "HEAD", cache: "no-store" });
          if (cancelled) return;
          if (res.ok) {
            setAssetUrl(url);
            return;
          }
        } catch {
          // Network hiccup / dev-server quirk — try the next candidate.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Desktop + fine-pointer + motion-ok only, and only once the browser is
  // idle — this is a decorative extra, never something worth delaying paint
  // or competing with real interaction for.
  useEffect(() => {
    if (!assetUrl) return;

    const isDesktop = window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isDesktop || reducedMotion) return;

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
  }, [assetUrl]);

  // Mount the three.js / gaussian-splats-3d viewer once activated.
  useEffect(() => {
    if (!active || !assetUrl) return;
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let viewer: any;
    let renderer: any;
    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      const [GaussianSplats3D, THREE] = await Promise.all([
        import("@mkkellogg/gaussian-splats-3d"),
        import("three"),
      ]);
      if (disposed || !container) return;

      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;

      // We build our own renderer (rather than letting the viewer create
      // its default one) for two reasons: (1) `alpha: true` is required for
      // a real transparent background — the viewer's internal renderer
      // doesn't request an alpha context, so its "transparent" clear color
      // would render as opaque black; (2) the library's dispose() assumes
      // an internally-created renderer's root element was appended to
      // `document.body` and unconditionally calls
      // `document.body.removeChild(rootElement)` — which throws when the
      // root element actually lives inside our own React tree. Supplying
      // an external renderer skips both of those internal code paths.
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, precision: "highp" });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      container.appendChild(renderer.domElement);

      viewer = new GaussianSplats3D.Viewer({
        rootElement: container,
        renderer,
        selfDrivenMode: true,
        useBuiltInControls: true,
        cameraUp: [0, -1, -0.6],
        initialCameraPosition: [-1, -4, 6],
        initialCameraLookAt: [0, 0, 0],
        sharedMemoryForWorkers: false,
        logLevel: GaussianSplats3D.LogLevel?.None,
      });

      if (disposed) {
        renderer.dispose();
        return;
      }

      // Subtle idle auto-orbit, drag to orbit, no scroll-wheel zoom-jacking.
      const controls = viewer.controls;
      if (controls) {
        controls.enableZoom = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.6;
      }

      resizeObserver = new ResizeObserver(() => {
        if (!container || !viewer?.camera) return;
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        renderer.setSize(w, h, false);
        viewer.camera.aspect = w / h;
        viewer.camera.updateProjectionMatrix();
      });
      resizeObserver.observe(container);

      try {
        // progressiveLoad streams splats in, and addSplatScene's promise
        // resolves BEFORE that streaming finishes — so framing only off the
        // resolved promise measures a mesh that's still nearly empty and
        // leaves the camera at its useless default. Re-frame when the loader
        // reports Done, which is the first moment the full scene exists.
        await viewer.addSplatScene(assetUrl, {
          showLoadingUI: false,
          progressiveLoad: true,
          // NOTE: 2 is LoaderStatus.Done. That enum is defined inside the
          // package but NOT exported, so referencing GaussianSplats3D
          // .LoaderStatus.Done throws a TypeError on the first progress event
          // — which aborts the whole download. The literal is the only safe
          // way to spell it.
          onProgress: (_percent: number, _label: string, status: number) => {
            if (status === 2 && !disposed) frameSceneToCamera(viewer, THREE);
          },
        });
        if (disposed) return;
        frameSceneToCamera(viewer, THREE);
        viewer.start();
        setReady(true);
      } catch (err) {
        // Bad or incompatible asset — the photo stays visible either way, but
        // log it: a silent failure here is otherwise indistinguishable from
        // "no asset present", which makes a bad export very hard to diagnose.
        console.warn("[SplatHero] splat failed to load:", err);
      }
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (viewer) {
        viewer.stop();
        viewer.dispose().catch(() => {});
      }
      if (renderer) {
        renderer.dispose();
        renderer.domElement.parentElement?.removeChild(renderer.domElement);
      }
    };
  }, [active, assetUrl]);

  if (!assetUrl) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      <div
        ref={containerRef}
        className={`pointer-events-auto absolute bottom-0 right-0 h-[min(60%,26rem)] w-[min(34%,24.5rem)] transition-opacity duration-700 ${
          active && ready ? "opacity-100" : "opacity-0"
        }`}
      />
      {active && ready && (
        <p className="pointer-events-none absolute bottom-2 right-2 font-mono text-xs text-mist">
          ← drag · a real Gaussian splat
        </p>
      )}
    </div>
  );
}
