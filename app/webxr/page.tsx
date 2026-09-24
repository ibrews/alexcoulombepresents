import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";

export const metadata: Metadata = {
  title: "WebXR Demos",
  description: "Hand-tracked WebXR built by Alex Coulombe Presents — Swing City, XR Probe, Isle, and Holodeck-in-a-Pocket. No install, one link.",
  alternates: { canonical: "/webxr" },
  robots: { index: false, follow: false },
};

type Demo = {
  name: string;
  url: string;
  repo?: string;
  blurb: string;
  hands: string;
  status: string;
};

const demos: Demo[] = [
  {
    name: "XR Probe",
    url: "https://ibrews.github.io/xr-probe/",
    repo: "https://github.com/ibrews/xr-probe",
    blurb: "A WebXR capability readout — open first on any new device.",
    hands: "Tap Enter VR (or Enter AR). Any pinch re-centers the panel. Photograph it.",
    status: "Live on Meta VR Glasses 2026-09-24 — Enter AR worked with occlusion; Enter VR fixed same day.",
  },
  {
    name: "Swing City",
    url: "https://ibrews.github.io/swing-city/",
    repo: "https://github.com/ibrews/swing-city",
    blurb: "Web-swinging over a rain-soaked neon city, Three.js, no build step.",
    hands: "Left pinch walks where you look. Right pinch fires the web. Double-pinch left for third person. Double-pinch right for a 180° about-face.",
    status: "Confirmed on Quest hands 2026-09-24 — \"looks good.\"",
  },
  {
    name: "Isle WebXR",
    url: "https://isle-webxr.alexcoulombe.workers.dev/tutorial/",
    blurb: "A cooperative multiplayer room for Isle Worlds — passphrase-gated client playtest.",
    hands: "Look or point at a floor ring to move. Pinch-hold a TIP button to lean the room, pinch it twice to throw it. Palms push objects.",
    status: "Password: ISLEJALI. Emulator-verified only — never run on a physical headset yet.",
  },
  {
    name: "Holodeck-in-a-Pocket",
    url: "https://ibrews.github.io/holodeck-pocket/",
    repo: "https://github.com/ibrews/holodeck-pocket",
    blurb: "Scan a QR code, walk through a venue — no app install.",
    hands: "Point and pinch.",
    status: "Built for FMX/NXT BLD 2026 — phone-tested; backup demo.",
  },
];

const topQuestions = [
  "Do third-party apps get eye-tracking data, or is gaze an OS-only cursor?",
  "Is eye-tracked foveated rendering automatic for every app, or opt-in?",
  "How does gaze + pinch reach an app built for hands or controllers?",
  "In the Meta Browser, does gaze + pinch arrive as a transient-pointer source, tracked hands, or both — and are 25 joints exposed with hands in the lap?",
  "Is this a Quest 3-class performance target or a new tier, and can apps use the NPU?",
  "Camera access, depth, and scene understanding — parity with Quest 3?",
  "70° FOV: any OS help for apps that park UI at a Quest 3 view's edges? Should devs keep testing on Quest 3?",
  "Enterprise, after the February exit from commercial Quest: sold to businesses at all? MDM APIs? Kiosk mode?",
  "Dev kits before spring 2027, and a Meta XR Simulator profile for the glasses before hardware ships?",
  "Holograms: body tracking, the 6DoF timeline, a third-party SDK, and is the scan done by phone?",
  "What exactly does the device readiness check check — calibration state, hardware capability, or store-side compatibility — and is there a WebXR equivalent?",
  "Is AI-assisted porting to VR Glasses the same tool as Android-app-to-Quest AI porting (via the Meta VR CLI), or something new and glasses-specific?",
];

export default function WebXR() {
  return (
    <div className="relative mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <p className="font-mono text-sm text-teal">/webxr</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Hand-tracked <span className="grad-text">WebXR.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mist">
          One link, no install. Open any of these in a headset&apos;s own browser —
          Meta VR Glasses, Quest, or Apple Vision Pro.
        </p>
      </Reveal>

      <div className="mt-12 space-y-6">
        {demos.map((demo, i) => (
          <Reveal key={demo.name} delay={i * 80}>
            <div className="glass rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-snow">{demo.name}</h2>
                {demo.repo && (
                  <a
                    href={demo.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-mist transition-colors hover:text-teal"
                  >
                    source ↗
                  </a>
                )}
              </div>
              <p className="mt-2 text-mist">{demo.blurb}</p>
              <a
                href={demo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block break-all rounded-full border border-teal/60 px-4 py-2 font-mono text-sm text-teal transition-colors hover:bg-teal/10"
              >
                {demo.url.replace(/^https:\/\//, "")} →
              </a>
              <p className="mt-4 text-sm leading-relaxed text-mist">
                <span className="font-mono text-xs uppercase tracking-widest text-amber">Hands </span>
                {demo.hands}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                <span className="font-mono text-xs uppercase tracking-widest text-amber">Status </span>
                {demo.status}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <section className="mt-16">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Meta VR Glasses hands-on</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-snow">Questions to ask first</h2>
          <p className="mt-3 max-w-2xl text-mist">
            Nothing day-one press covered: SDK/API changes, eye-tracking data access, WebXR, enterprise, dev kits.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <ol className="mt-6 space-y-3">
            {topQuestions.map((q, i) => (
              <li key={i} className="flex gap-4 text-mist">
                <span className="font-mono text-sm text-teal">{String(i + 1).padStart(2, "0")}</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>
    </div>
  );
}
