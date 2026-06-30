"use client";
import { useEffect, useRef, useState } from "react";
import { buildAvatar } from "./avatar";

function spawnParticles(cx: number, cy: number) {
  const colors = ["#fde68a", "#a78bfa", "#00d4ff", "#f43f5e", "#fff", "#f59e0b"];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const dist = 40 + Math.random() * 60;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const p = document.createElement("div");
    const size = 4 + Math.random() * 4;
    p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;border-radius:50%;background:${colors[i % colors.length]};pointer-events:none;z-index:9999;transition:all .7s ease-out;transform:translate(-50%,-50%)`;
    document.body.appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px))`;
      p.style.opacity = "0";
    });
    setTimeout(() => p.remove(), 800);
  }
}

export default function AvatarCorner() {
  const svgRef = useRef<SVGSVGElement>(null);
  const avatarRef = useRef<SVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || avatarRef.current) return;
    avatarRef.current = buildAvatar(svg as unknown as SVGElement, { scale: 1 });
  }, []);

  function onEnter() { avatarRef.current?.classList.add("arm-up"); }
  function onLeave() { avatarRef.current?.classList.remove("arm-up"); }

  function handleClick() {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setOpen(true);
  }

  // Boot Three.js voxel renderer whenever the overlay opens
  useEffect(() => {
    if (!open) return;

    let disposed = false;
    let animId: number;
    let burstInterval: ReturnType<typeof setInterval>;

    (async () => {
      // Dynamic import — only loads on first click (~600 KB, cached after)
      const THREE = await import("three");
      if (disposed || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const W = 256, H = 360;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, W / H, 1, 500);
      camera.position.set(0, 10, 120);
      camera.lookAt(0, 7, 0);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);

      scene.add(new THREE.AmbientLight(0x8888aa, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(3, 8, 5);
      scene.add(dir);

      // Build voxels: extrude each pixel rect from the SVG avatar into a BoxGeometry
      const group = new THREE.Group();
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
      tmp.setAttribute("viewBox", "-22 -46 44 76");
      Object.assign(tmp.style, { position: "absolute", visibility: "hidden", pointerEvents: "none" });
      document.body.appendChild(tmp);

      const tmpAv = buildAvatar(tmp as unknown as SVGElement, { withBeard: true });
      const armsDown = tmpAv.querySelector(".av-arms-down") as SVGElement | null;
      const armsUp = tmpAv.querySelector(".av-arms-up") as SVGElement | null;
      if (armsDown) armsDown.style.display = "none";
      if (armsUp) armsUp.style.display = "block";

      // Filter out hidden rects and extrude each into a cube
      [...tmp.querySelectorAll("rect")]
        .filter(r => !armsDown?.contains(r))
        .forEach(r => {
          const x = parseFloat(r.getAttribute("x") ?? "0");
          const y = parseFloat(r.getAttribute("y") ?? "0");
          const w = parseFloat(r.getAttribute("width") ?? "1");
          const h = parseFloat(r.getAttribute("height") ?? "1");
          const fill = r.getAttribute("fill") ?? "#888";
          const cx = x + w / 2;
          const cy = -(y + h / 2);
          const area = w * h;
          // Small face-detail rects pushed forward so they read over the head block
          const isFaceDetail = area < 55 && Math.abs(cx) <= 16 && cy >= 10 && cy <= 45;
          const geo = new THREE.BoxGeometry(w, h, Math.min(w, h) * 0.8);
          const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(fill), roughness: 0.7 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(cx, cy, isFaceDetail ? 13 : 0);
          group.add(mesh);
        });

      document.body.removeChild(tmp);
      scene.add(group);

      function animate() {
        if (disposed) return;
        animId = requestAnimationFrame(animate);
        group.rotation.y = Math.sin(performance.now() * 0.0006) * 0.3;
        renderer.render(scene, camera);
      }
      animate();

      // Particle bursts from voxel hands every few seconds
      function burst() {
        if (!canvasRef.current) return;
        const r = canvasRef.current.getBoundingClientRect();
        spawnParticles(r.left + r.width * 0.2, r.top + r.height * 0.38);
        spawnParticles(r.left + r.width * 0.8, r.top + r.height * 0.38);
      }
      setTimeout(burst, 300);
      burstInterval = setInterval(burst, 3500);

      const MeshCls = THREE.Mesh;
      disposeRef.current = () => {
        disposed = true;
        clearInterval(burstInterval);
        cancelAnimationFrame(animId);
        renderer.dispose();
        group.traverse(o => {
          if (o instanceof MeshCls) {
            o.geometry.dispose();
            if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
            else o.material.dispose();
          }
        });
      };
    })();

    return () => {
      disposeRef.current?.();
      disposeRef.current = null;
    };
  }, [open]);

  function close() {
    disposeRef.current?.();
    disposeRef.current = null;
    setOpen(false);
  }

  return (
    <>
      {/* 2D pixel sprite — upper right, below nav */}
      <svg
        ref={svgRef}
        viewBox="-18 -43 36 71"
        className="pointer-events-auto absolute right-0 top-16 w-20 cursor-pointer opacity-60 transition-opacity hover:opacity-100 md:right-2 md:top-20 md:w-28"
        aria-label="Meet Pixel Alex — click to go 3D"
        role="button"
        tabIndex={0}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onClick={handleClick}
        onKeyDown={e => e.key === "Enter" && handleClick()}
      />

      {/* 3D voxel overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={close}
          onKeyDown={e => e.key === "Escape" && close()}
          role="dialog"
          aria-modal
          aria-label="3D Voxel Alex"
        >
          <div className="relative" onClick={e => e.stopPropagation()}>
            <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-teal">
              From Pixel to Voxel · HXR 2026
            </p>
            <canvas
              ref={canvasRef}
              width={256}
              height={360}
              className="block rounded-xl"
              style={{ width: 256, height: 360 }}
            />
            <button
              onClick={close}
              className="absolute -right-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs text-white ring-1 ring-white/20 hover:bg-white/20"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
