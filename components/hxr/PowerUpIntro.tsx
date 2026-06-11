"use client";

import { useEffect, useRef, useState } from "react";
import { svgE, buildAvatar, paintWornHeadset } from "./avatar";

// Slide 3 of the HarvardXR 2026 keynote, ported: the Mario power-up.
// Pixel Alex walks on stage, jumps, hits the VR-headset "?" block —
// flash, particle burst, chiptune SFX — and emerges 1.5× with the
// headset on. Click to play (the click is also the browser's audio gesture).
export default function PowerUpIntro() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const playRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const svg = svgE("svg", { viewBox: "0 0 400 400" });
    host.appendChild(svg);

    // Stage floor
    svg.appendChild(svgE("rect", { x: 30, y: 300, width: 340, height: 6, class: "stage-floor", rx: "2" }));

    // VR headset "?" block — outer group positions, inner group animates
    const blockPos = svgE("g", { class: "headset-block", transform: "translate(240, 200)" });
    const blockG = svgE("g", {}) as SVGGElement;
    blockPos.appendChild(blockG);
    blockG.appendChild(svgE("rect", { x: -22, y: -22, width: 44, height: 44, fill: "#f59e0b", stroke: "#b45309", "stroke-width": "2", rx: "3" }));
    blockG.appendChild(svgE("rect", { x: -18, y: -18, width: 36, height: 36, fill: "none", stroke: "#fde68a", "stroke-width": "1", rx: "1" }));
    blockG.appendChild(svgE("rect", { x: -13, y: -7, width: 26, height: 14, rx: "5", fill: "#1a1a26" }));
    blockG.appendChild(svgE("circle", { cx: -6, cy: 0, r: "3", fill: "#00d4ff" }));
    blockG.appendChild(svgE("circle", { cx: 6, cy: 0, r: "3", fill: "#00d4ff" }));
    blockG.appendChild(svgE("rect", { x: -13, y: -9, width: 26, height: 2, fill: "#0a0a14" }));
    blockG.style.transformOrigin = "center";
    blockG.style.animation = "introHeadsetBob 1.6s ease-in-out infinite";
    svg.appendChild(blockPos);

    // Walker — outer anchors position, inner gets the CSS animations
    const walkerG = svgE("g", { class: "stage-walker", transform: "translate(80, 270)" }) as SVGGElement;
    const anim = svgE("g", { class: "hxr-anim" }) as SVGGElement;
    walkerG.appendChild(anim);
    const avatarRoot = buildAvatar(anim, { withBeard: false }); // 2016 Alex — beard comes later
    const avatarBody = avatarRoot.querySelector(".av-body") as SVGElement;
    svg.appendChild(walkerG);
    anim.style.opacity = "0";

    // Particle burst
    const sparkles = svgE("g", { opacity: "0" }) as SVGGElement;
    const FW_COLORS = ["#fde68a", "#00d4ff", "#a78bfa", "#f59e0b", "#fff", "#fb7185"];
    const BURST_X = 240, BURST_Y = 200;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 55 + Math.random() * 45;
      const sp = svgE("circle", {
        cx: BURST_X, cy: BURST_Y, r: (1.2 + Math.random() * 2.2).toFixed(1),
        fill: FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)],
        "data-dx": (Math.cos(angle) * dist).toFixed(1),
        "data-dy": (Math.sin(angle) * dist).toFixed(1),
      }) as SVGCircleElement;
      sp.style.transformOrigin = `${BURST_X}px ${BURST_Y}px`;
      sparkles.appendChild(sp);
    }
    svg.appendChild(sparkles);

    // Flash overlay
    const flash = svgE("rect", { x: 0, y: 0, width: 400, height: 400, fill: "#fff", opacity: "0", "pointer-events": "none" }) as SVGRectElement;
    svg.appendChild(flash);

    // Mario-style power-up SFX — generated, no audio files
    let audioCtx: AudioContext | null = null;
    function playPowerUpSfx() {
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        const ctx = audioCtx;
        if (ctx.state === "suspended") ctx.resume();
        const now = ctx.currentTime;
        const tone = (freq: number, start: number, dur: number, type: OscillatorType = "square", volume = 0.12) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(volume, now + start);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.start(now + start);
          osc.stop(now + start + dur);
        };
        tone(988, 0.0, 0.08, "square", 0.1);
        tone(1319, 0.08, 0.18, "square", 0.1);
        tone(392, 0.25, 0.06, "square", 0.1);
        tone(523, 0.31, 0.06, "square", 0.1);
        tone(659, 0.37, 0.06, "square", 0.1);
        tone(784, 0.43, 0.06, "square", 0.11);
        tone(1047, 0.49, 0.06, "square", 0.11);
        tone(1319, 0.55, 0.18, "square", 0.12);
        tone(1568, 0.8, 0.25, "square", 0.13);
      } catch {}
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    playRef.current = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
      // Reset
      anim.style.animation = "none";
      anim.style.transform = "";
      anim.style.opacity = "0";
      blockPos.setAttribute("opacity", "1");
      blockG.style.animation = "introHeadsetBob 1.6s ease-in-out infinite";
      sparkles.style.opacity = "0";
      sparkles.querySelectorAll("circle").forEach((c) => ((c as SVGCircleElement).style.animation = "none"));
      flash.style.animation = "none";
      flash.style.opacity = "0";
      avatarBody.querySelector(".worn-headset")?.remove();
      void (anim as unknown as HTMLElement).offsetWidth;

      const DELAY = 300;
      later(() => { anim.style.opacity = "1"; anim.style.animation = "introWalk 2s linear 0s 1 normal both"; }, DELAY);
      later(() => { anim.style.animation = "introJumpUp .4s cubic-bezier(.3,.7,.4,1) 0s 1 normal both"; }, DELAY + 2000);
      later(() => {
        flash.style.animation = "introFlash .45s ease-out forwards";
        blockG.style.animation = "introHeadsetGrab .5s ease-out forwards";
        sparkles.style.opacity = "1";
        sparkles.querySelectorAll("circle").forEach((p) => {
          const el = p as SVGCircleElement;
          el.style.setProperty("--tx", `${p.getAttribute("data-dx")}px`);
          el.style.setProperty("--ty", `${p.getAttribute("data-dy")}px`);
          el.style.animation = "introSparkle 1.1s ease-out forwards";
        });
        playPowerUpSfx();
        anim.style.animation = "introPowerUp .8s ease-out forwards";
      }, DELAY + 2400);
      later(() => paintWornHeadset(avatarBody), DELAY + 2900);
      later(() => { anim.style.animation = "introFallDown .55s cubic-bezier(.55,0,.8,1) forwards"; }, DELAY + 3200);
      later(() => {
        anim.style.animation = "none";
        anim.style.transform = "translate(160px, 0) scale(1.5)";
        setState("done");
      }, DELAY + 3780);
    };

    return () => {
      timers.forEach(clearTimeout);
      audioCtx?.close().catch(() => {});
      host.removeChild(svg);
    };
  }, []);

  return (
    <div className="hxr-stage relative">
      <div ref={hostRef} className="w-full [&>svg]:h-auto [&>svg]:w-full" />
      {state !== "playing" && (
        <button
          onClick={() => { setState("playing"); playRef.current(); }}
          className="absolute inset-0 flex items-end justify-center pb-2"
          aria-label={state === "done" ? "Replay the power-up" : "Play the power-up"}
        >
          <span className="rounded-full border border-amber/60 bg-ink/80 px-5 py-2 font-mono text-sm text-amber backdrop-blur transition-transform hover:scale-105">
            {state === "done" ? "↺ one more time" : "▶ press start (sound on)"}
          </span>
        </button>
      )}
    </div>
  );
}
