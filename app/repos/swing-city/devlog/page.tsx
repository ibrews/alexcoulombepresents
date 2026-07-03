import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import DevlogNote from "@/components/DevlogNote";
import { repos } from "@/lib/data";

const repo = repos.find((r) => r.slug === "swing-city")!;

export const metadata: Metadata = {
  title: "Swing City — Devlog",
  description:
    "From a Blender/Python procedural-city script to a browser game with real physics, WebXR, and Cloudflare-backed multiplayer — the bugs and all.",
  alternates: { canonical: "/repos/swing-city/devlog" },
};

export default function SwingCityDevlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="ember" />
      <Reveal>
        <Link href="/repos/swing-city" className="font-mono text-sm text-mist hover:text-teal">
          ← Swing City
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-amber">Devlog</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Building Swing City</h1>
        <p className="mt-5 text-xl leading-relaxed text-mist">
          A procedural city that started as a Blender script became a web-swinging, wall-crawling,
          car-knocking browser game with gamepad, touch, and WebXR support — then grew a real
          multiplayer mode over a Cloudflare Worker. This is the story of how it got built, and the
          bugs that had to be found before it felt right.
        </p>
      </Reveal>

      {/* ── Origins ───────────────────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">01 · Origins</p>
          <h2 className="mt-3 text-2xl font-bold">A city that starts as a seed</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              Swing City didn&apos;t start as a game. It started as{" "}
              <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-sm text-amber">
                city_generator.py
              </code>
              , a Blender/Python script that lays out a low-poly, Blade Runner–style grid from a single
              seed — streets, traffic-light-obeying cars, rain, neon towers — the same layout every time
              you feed it the same number.
            </p>
            <p>
              Porting that into a browser game meant carrying the same layout math, window-facade shader
              logic, signal cycle, and stop-and-go traffic simulation over into a single self-contained{" "}
              <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-sm text-amber">
                index.html
              </code>{" "}
              — one file, Three.js pulled from a CDN, no build step. Feed it the same seed in Blender and
              in the browser and you get the same city both places.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Making it feel like a game ───────────────────────────── */}
      <Reveal>
        <div className="glass mt-8 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">02 · Feel</p>
          <h2 className="mt-3 text-2xl font-bold">Making it feel like a game</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              The first version had one verb: swing. Fire a web at a building, get yanked toward it. It
              also had a bug baked into the yank itself — the rope started 10% shorter than the actual
              distance to the anchor, so attaching snapped you toward it in a single frame instead of
              swinging out from where you stood. Fixing the math (the rope now starts at your exact
              current distance, only ever clamped shorter for street clearance) was round one. Round two
              found a second cause of the same symptom: a ground-clearance clamp that could still shorten
              the rope below the true attach-moment distance for some anchors — which explained why the
              teleport didn&apos;t happen on <em>every</em> swing. The fix was to remove the clamp
              entirely and let the existing collision system handle ground safety instead of a
              rope-length hack.
            </p>
            <p>
              A public-facing rewrite added the things that make a physics sandbox feel like an actual
              game: a 240-unit sky-fall spawn instead of starting already standing on a rooftop, typed
              pickups (score orbs, a noir desaturation effect, jump boosts, slow-time, and a rare zombie
              trigger — each a distinct shape and color so you can tell them apart before committing to a
              swing), zombies that rise out of the street with stacking contact-damage, and a full
              synthesized audio layer: thwip on web-fire, a collision thud, pickup chimes, an explosion
              boom, and a procedurally generated noir chiptune loop built from the same seeded RNG as the
              city, so the soundtrack is reproducible per-seed without repeating the exact same melody
              every load.
            </p>
            <p>
              That same pass root-caused an always-explode bug instead of just patching around it: the
              out-of-bounds margin sat 14 units past the city edge, and the ground plane extended roughly
              90 <em>more</em> units past even that — so you could walk far outside the playable world
              while still standing on lit &ldquo;city ground,&rdquo; with nothing telling you you&apos;d
              already left it. The fix tightened the margin, shrank the ground to match, and added a
              visible glowing boundary wall at the exact trigger radius, so the edge became something you
              see coming instead of an invisible tripwire.
            </p>
            <p>
              Movement itself got redesigned once holding spacebar turned into a stutter-hop instead of a
              jump: the old code re-applied jump velocity every single frame Space was held while
              grounded — up an inch, gravity pulls back down, re-fire immediately. The fix was to make
              web-fire edge-triggered (a fresh press does something, holding does nothing extra) and drop
              standalone jumping in favor of treating every press as a pull — toward a building if one is
              in range, toward nothing in particular if it isn&apos;t, but always a deliberate motion
              rather than a repeating one.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Bugs found the hard way ───────────────────────────────── */}
      <Reveal>
        <div className="mt-14">
          <p className="font-mono text-xs uppercase tracking-widest text-sky">03 · Postmortems</p>
          <h2 className="mt-3 text-2xl font-bold">Bugs found the hard way</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-mist">
            Some of these only showed up once real hands were on the controller — a category of bug this
            project kept running into, and kept naming honestly in its own commit messages rather than
            quietly re-patching.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <DevlogNote title="The car that never actually tumbled" tag="physics">
              <p>
                Knocking a car sent it flying — score ticked up, the sound played — but the car itself
                never really tumbled. Cars spawn at{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">y=0</code>
                , so on the very first frame after a knock, integration only climbs a fraction of a unit —
                nowhere near clearing the 0.25 ground-settle threshold on its own. Without a check on
                which direction the car was actually moving, every knock silently snapped straight back
                to grounded-and-motionless on frame one. The physics call fired correctly; the physics
                itself never got to play out. The fix only settles a car while it&apos;s falling (
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  vel.y &lt;= 0
                </code>
                ), not on the way up.
              </p>
            </DevlogNote>

            <DevlogNote title="The framerate that only got worse the longer you played" tag="real-world only">
              <p>
                WebXR support required switching the render loop to{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  renderer.setAnimationLoop(loop)
                </code>{" "}
                — but the old self-recursing{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  requestAnimationFrame(loop)
                </code>{" "}
                call was left in place underneath it, doubling and compounding scheduled frames every
                tick. The framerate didn&apos;t start bad — it got steadily worse the longer a session
                ran, which is exactly the shape of a leak like this. This one is invisible to headless or
                automated verification, because{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">rAF</code>{" "}
                never fires in that kind of environment at all — it only ever showed up by actually
                playing.
              </p>
            </DevlogNote>

            <DevlogNote title="A web line invisible on some GPUs" tag="rendering">
              <p>
                The web-swing line was drawn with plain{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  THREE.Line
                </code>
                , which relies on{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  gl.LINE_WIDTH
                </code>
                . Most GPU drivers clamp that to 1px regardless of what you ask for, so depending on the
                hardware the line either drew thin and faint or effectively vanished. Swapping to
                Line2/LineGeometry/LineMaterial draws real screen-space geometry instead of relying on a
                driver-dependent primitive, so line width actually means something everywhere.
              </p>
            </DevlogNote>

            <DevlogNote title="Building facades that ignored the scene's own light" tag="shaders">
              <p>
                &ldquo;Brighten the world a little — still night, but not 90% black,&rdquo; was the ask.
                Turning up ambient light and exposure barely moved the buildings at all. The dark wall
                material between the windows was a raw shader computing its own color and ignoring
                ambient and exposure entirely — no amount of turning the global lighting levers was ever
                going to touch it. The fix was to change the shader&apos;s actual base-color constant, not
                keep tuning levers that could never reach it.
              </p>
            </DevlogNote>
          </div>
        </div>
      </Reveal>

      {/* ── Everywhere you play ──────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-8 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">04 · Input</p>
          <h2 className="mt-3 text-2xl font-bold">Everywhere you play</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              Gamepad and touchscreen input map onto the same primitives keyboard and mouse already
              drive, so support just works everywhere keyboard does — no separate input paths to keep in
              sync.
            </p>
            <p>
              WebXR needed a different trick, because a headset owns the camera&apos;s transform the
              moment it starts presenting — you can&apos;t just keep moving the camera directly the way
              desktop play does. The fix is the standard WebXR &ldquo;dolly&rdquo; pattern: the camera is
              a child of a movable rig group, not moved on its own. Outside XR, the rig sits at identity —
              a child&apos;s local transform under an identity parent <em>is</em> its world transform, so
              desktop play stays byte-for-byte unchanged. Only once a headset is presenting does the
              third-person follow-camera code retarget from the camera to the rig instead — the headset
              then supplies the player&apos;s actual head look on top of the same follow-the-player
              positioning desktop already used.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Going multiplayer ────────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-8 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">05 · Multiplayer</p>
          <h2 className="mt-3 text-2xl font-bold">Going multiplayer</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              Multiplayer is a pure relay: a Cloudflare Worker backed by a Durable Object, running one
              &ldquo;Room&rdquo; per game with no server-side physics at all. Every client sends its own
              state roughly 15 times a second — position, look yaw, web-anchor state, alive flag — and the
              Durable Object fans it straight out to everyone else. Position is whatever the client says
              it is, the same trust model the rest of the game has always used; there was never a server
              before this, so there was never server-side authority to lose. It runs on the WebSocket
              Hibernation API, so a room full of idle-but-open sockets doesn&apos;t pin the Durable Object
              in memory between messages.
            </p>
            <p>
              The rules are joust rules: land on top of another player and they explode. Getting that to
              read correctly for everyone in the room took a couple of passes — the first version only
              called the victim&apos;s own explosion effect, so bystanders just saw an avatar vanish the
              next time an <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">alive: false</code>{" "}
              update arrived, with no explosion to explain it. And remote avatars first rendered in one
              shared placeholder color, because the server tagged each connection with an id but not the
              color it had assigned — fixed by broadcasting the color on every state update, same as the
              id.
            </p>
            <p>
              The first real deploy hit a genuine Cloudflare-side network incident in the ENAM/WNAM
              region — confirmed against Cloudflare&apos;s own status page, not a misconfiguration on this
              end — that resolved on its own; the deploy was verified end-to-end against the live Worker
              once it cleared. Local development doesn&apos;t need any of that: <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">wrangler dev --local</code>{" "}
              runs the same Durable Object via Miniflare with zero Cloudflare login required, which is
              also how the whole relay — connect, remote-player sync, joust detection, the
              server-relayed broadcast, and the local game-over-on-being-jousted path — got verified
              before any of it shipped for real.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-14 flex flex-wrap gap-3">
          {repo.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
            >
              {l.label} →
            </a>
          ))}
          <Link
            href="/repos/swing-city"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape/60"
          >
            Back to the repo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
