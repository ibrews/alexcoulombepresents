// Shared pixel-art helpers, ported from the HarvardXR 2026 keynote
// (https://ibrews.github.io/harvardxr-keynote/) — the "Stardew Alex" sprite.

export function svgE(t: string, a?: Record<string, string | number>): SVGElement {
  const e = document.createElementNS("http://www.w3.org/2000/svg", t) as SVGElement;
  if (a) Object.entries(a).forEach(([k, v]) => e.setAttribute(k, String(v)));
  return e;
}

// buildAvatar(parent, opts) — appends a chunky pixel-art figure to `parent`.
// Local coordinates centered on 0,0; spans y=-43..+28, x=-18..+18.
// Two arm states (down/up) toggled via the `arm-up` class on the root.
export function buildAvatar(
  parent: SVGElement,
  opts: { scale?: number; withBeard?: boolean; id?: string } = {}
): SVGElement {
  const scale = opts.scale || 1;
  const withBeard = !!opts.withBeard;
  const root = svgE("g", { class: "avatar", ...(opts.id ? { id: opts.id } : {}) }) as SVGGElement;
  root.style.shapeRendering = "crispEdges";
  if (scale !== 1) root.setAttribute("transform", `scale(${scale})`);
  parent.appendChild(root);

  const SKIN = "#f2c79b", SKIN_DARK = "#d9a77a";
  const HAIR_LIGHT = "#a8602f", HAIR = "#8b4a2a", HAIR_DARK = "#5e2f1a", HAIR_SHADOW = "#3a1c08";
  const BEARD = "#6e3a1e", BEARD_LIGHT = "#8a4f2a";
  const SHIRT = "#6a8fd6", SHIRT_DARK = "#4a6fb8";
  const PANTS = "#3f3025", BOOTS = "#1f150c";
  const EYE = "#1a1a26";

  const px = (g: SVGElement, x: number, y: number, w: number, h: number, fill: string) =>
    g.appendChild(svgE("rect", { x, y, width: w, height: h, fill }));

  const body = svgE("g", { class: "av-body" });

  // Head
  px(body, -12, -34, 24, 22, SKIN);
  px(body, -12, -16, 24, 4, SKIN_DARK);
  // Hair — tousled dome, 3 tones + shadow
  px(body, -13, -40, 26, 2, HAIR_SHADOW);
  px(body, -15, -38, 30, 3, HAIR_SHADOW);
  px(body, -16, -36, 32, 4, HAIR_SHADOW);
  px(body, -9, -42, 5, 2, HAIR_SHADOW);
  px(body, 3, -42, 4, 2, HAIR_SHADOW);
  px(body, -2, -43, 5, 1, HAIR_SHADOW);
  px(body, -12, -40, 24, 2, HAIR_DARK);
  px(body, -14, -38, 28, 3, HAIR_DARK);
  px(body, -13, -34, 30, 3, HAIR_DARK);
  px(body, -8, -42, 4, 2, HAIR_DARK);
  px(body, 4, -42, 3, 2, HAIR_DARK);
  px(body, -1, -43, 3, 1, HAIR_DARK);
  px(body, -11, -41, 22, 1, HAIR);
  px(body, -13, -38, 26, 2, HAIR);
  px(body, -14, -36, 28, 2, HAIR);
  px(body, -8, -41, 4, 1, HAIR);
  px(body, 4, -41, 3, 1, HAIR);
  px(body, -13, -34, 2, 3, HAIR_DARK);
  px(body, 12, -33, 2, 3, HAIR_DARK);
  px(body, -14, -31, 2, 4, HAIR);
  px(body, 10, -31, 1, 2, HAIR);
  px(body, -8, -40, 3, 1, HAIR_LIGHT);
  px(body, 4, -40, 2, 1, HAIR_LIGHT);
  px(body, -10, -38, 2, 1, HAIR_LIGHT);
  px(body, -2, -42, 2, 1, HAIR_LIGHT);
  px(body, -7, -41, 2, 1, HAIR_LIGHT);
  // Fringe
  px(body, -12, -34, 5, 3, HAIR_DARK);
  px(body, -11, -33, 4, 2, HAIR);
  px(body, -7, -34, 3, 2, HAIR_DARK);
  px(body, -7, -33, 2, 1, HAIR);
  px(body, -4, -34, 2, 4, HAIR_DARK);
  px(body, -4, -33, 1, 3, HAIR);
  px(body, -1, -34, 3, 2, HAIR_DARK);
  px(body, -1, -33, 2, 1, HAIR);
  px(body, 3, -34, 4, 3, HAIR_DARK);
  px(body, 3, -33, 3, 2, HAIR);
  px(body, 7, -34, 5, 4, HAIR_DARK);
  px(body, 10, -31, 3, 3, HAIR);
  px(body, -12, -31, 2, 1, HAIR_LIGHT);
  px(body, 8, -33, 2, 1, HAIR_LIGHT);
  // Eyebrows, eyes, mouth
  px(body, -8, -27, 8, 3, HAIR_DARK);
  px(body, 3, -28, 9, 4, HAIR_DARK);
  px(body, -7, -24, 3, 4, EYE);
  px(body, 4, -24, 3, 4, EYE);
  px(body, -6, -23, 1, 2, "#fff");
  px(body, 5, -23, 1, 2, "#fff");
  px(body, -3, -17, 6, 1, "#9c5040");
  if (withBeard) {
    px(body, -12, -22, 4, 5, BEARD);
    px(body, 8, -22, 4, 5, BEARD);
    px(body, -12, -20, 5, 3, BEARD);
    px(body, 7, -20, 5, 3, BEARD);
    px(body, -12, -17, 4, 1, BEARD);
    px(body, 8, -17, 4, 1, BEARD);
    px(body, -7, -19, 14, 2, BEARD);
    px(body, -6, -19, 12, 1, BEARD_LIGHT);
    px(body, -2, -16, 4, 1, BEARD);
    px(body, -12, -16, 24, 2, BEARD);
    px(body, -12, -14, 24, 2, BEARD);
    px(body, -10, -12, 20, 1, BEARD);
  }
  // Neck, shirt, pants, boots
  px(body, -4, -12, 8, 3, SKIN_DARK);
  px(body, -12, -9, 24, 18, SHIRT);
  px(body, -12, -9, 24, 3, SHIRT_DARK);
  px(body, -12, 6, 24, 3, SHIRT_DARK);
  px(body, -12, 9, 12, 14, PANTS);
  px(body, 0, 9, 12, 14, PANTS);
  px(body, -2, 9, 4, 14, "#2a1f18");
  px(body, -12, 23, 12, 5, BOOTS);
  px(body, 0, 23, 12, 5, BOOTS);
  root.appendChild(body);

  const armsDown = svgE("g", { class: "av-arms-down" });
  px(armsDown, -18, -8, 6, 14, SHIRT);
  px(armsDown, -18, 4, 6, 4, SKIN);
  px(armsDown, 12, -8, 6, 14, SHIRT);
  px(armsDown, 12, 4, 6, 4, SKIN);
  root.appendChild(armsDown);

  const armsUp = svgE("g", { class: "av-arms-up" });
  px(armsUp, -18, -22, 6, 14, SHIRT);
  px(armsUp, -18, -26, 6, 6, SKIN);
  px(armsUp, 12, -22, 6, 14, SHIRT);
  px(armsUp, 12, -26, 6, 6, SKIN);
  root.appendChild(armsUp);

  return root;
}

// Small CSS particle burst, fixed-positioned in viewport coords (cx, cy).
export function spawnParticles(cx: number, cy: number) {
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

// Paints the VR headset onto the avatar's face after the power-up.
export function paintWornHeadset(parentBody: SVGElement) {
  parentBody.querySelector(".worn-headset")?.remove();
  const hs = svgE("g", { class: "worn-headset" }) as SVGGElement;
  hs.style.shapeRendering = "crispEdges";
  const px = (x: number, y: number, w: number, h: number, fill: string) =>
    hs.appendChild(svgE("rect", { x, y, width: w, height: h, fill }));
  px(-13, -27, 26, 1, "#0a0a14");
  px(-13, -26, 26, 9, "#1a1a26");
  px(-13, -17, 26, 1, "#0a0a14");
  px(-8, -24, 5, 5, "#00d4ff");
  px(3, -24, 5, 5, "#00d4ff");
  px(-7, -23, 1, 1, "#fff");
  px(4, -23, 1, 1, "#fff");
  px(-13, -23, 1, 3, "#3a3a4e");
  px(12, -23, 1, 3, "#3a3a4e");
  parentBody.appendChild(hs);
}
