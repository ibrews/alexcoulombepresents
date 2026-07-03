import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import DevlogNote from "@/components/DevlogNote";
import ManifestItem from "@/components/ManifestItem";
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

      {/* ── Appendix: sample delegation manifest ─────────────────── */}
      <Reveal>
        <div className="mt-14">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">06 · Appendix</p>
          <h2 className="mt-3 text-2xl font-bold">Sample document: the delegation manifest</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-mist">
            After a family playtest of the multiplayer build, the follow-up list — sixteen items,
            everything from a two-line color fix to a full power-up framework — got routed by who
            should actually build each one: the local model fleet, Gemini, or a given Claude tier.
            This is the real planning document that came out of that pass, reproduced as-generated.
            It&apos;s an internal task-routing artifact, not a feature list — kept here as a concrete
            example of what that delegation process actually looks like on a real project.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {[
              { label: "Fleet — local, free", dot: "bg-teal" },
              { label: "Gemini — cheap cloud", dot: "bg-sky" },
              { label: "Sonnet — default Claude", dot: "bg-amber" },
              { label: "Opus — reserve", dot: "bg-grape" },
            ].map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-2 rounded-md border border-line bg-panel/40 px-2.5 py-1.5 font-mono text-xs text-mist"
              >
                <span className={`h-2 w-2 rounded-full ${l.dot}`} />
                {l.label}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <ManifestItem num="01" title="WebXR first-person mode, default in VR" tier="sonnet" confidence="90%">
              <p>
                Touches the <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">cameraRig</code> /{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">isPresenting</code> branch built this
                session — genuinely easy to get subtly wrong. That exact code already shipped one real
                regression (the duplicate <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">requestAnimationFrame</code> framerate bug). Needs new
                first-person math, a mode flag, and a toggle binding, still defaulting to third-person
                outside VR.
              </p>
              <p>
                Fleet-alone confidence: <strong className="text-snow">35%</strong>. Once the camera math exists, a narrower
                &ldquo;wire up this toggle key&rdquo; slice could go to fleet or Gemini.
              </p>
              <p className="rounded border-l-2 border-mist/40 bg-ink/40 py-2 pl-3 text-xs">
                Still can&apos;t test in-headset from here — needs your eyes once it ships.
              </p>
            </ManifestItem>

            <ManifestItem num="02" title="VR death screen — can't see the restart menu" tier="fleet" confidence="70%">
              <p>
                Simplest fix skips 3D UI entirely: auto-restart after a short delay when{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">gameOver &amp;&amp; renderer.xr.isPresenting</code>. Small, precise diff.
              </p>
              <p>
                If you&apos;d rather have a real head-locked menu — a text-sprite plane parented to the
                camera — that&apos;s bigger, and shares infrastructure with the name-tag and leaderboard
                work below, so it&apos;d sequence after those.
              </p>
            </ManifestItem>

            <ManifestItem num="03" title="Wall-climb: face the wall, reach the roof without releasing" tier="sonnet" confidence="75%">
              <p>
                Two parts. Orienting the pawn to face into the wall while climbing is mechanical once you
                know the wall-normal is already computed per-axis in the collision code — that half alone
                is roughly 60% fleet-able with a precise prompt. Smoothly transitioning onto the rooftop
                at the top of a climb needs reasoning about how the wall-crawl state interacts with
                ground/roof collision resolution — that half needs real context. Bundling as one task.
              </p>
            </ManifestItem>

            <ManifestItem num="04a" title="Rain sometimes audible but not visible" tier="fleet" confidence="55%">
              <p>
                Possibly the particle live-count rounds to near-zero at low intensity while the audio gain
                stays audible. Isolatable and testable independent of the sync problem below.
              </p>
            </ManifestItem>

            <ManifestItem num="04b" title="Rain / world state doesn't sync in multiplayer" tier="opus" confidence="15%">
              <p>
                Root cause: every client independently consumes the <em>same</em> seeded RNG stream for
                weather timers, but at different real-world moments depending on local frame timing — so
                weather desyncs between clients almost immediately after load.
              </p>
              <p>
                Fixing it properly means the server periodically broadcasts authoritative weather state, or
                weather gets derived deterministically from wall-clock time instead of a per-client-consumed
                PRNG stream. Genuine distributed-state design, not a tuning tweak — staying on Claude.
              </p>
            </ManifestItem>

            <ManifestItem num="05" title="Border walls bounce hard instead of grace-period death" tier="sonnet" confidence="65%">
              <p>
                Well-bounded physics change in code I know precisely. I&apos;ll write the first version —
                reflecting velocity off the out-of-bounds check — then a fleet or Gemini pass can tune
                bounce strength and feel iteratively once the mechanism exists. If I hand over a precise
                spec with the exact code location up front, fleet could plausibly take the whole thing solo.
              </p>
            </ManifestItem>

            <ManifestItem num="06" title="City 4× bigger, more variety, named buildings, Katakana" tier="gemini" confidence="65–70%">
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">Scale + performance check</p>
              <p>
                Sonnet checks that 4× the buildings doesn&apos;t tank draw calls; fleet can write the
                constant tuning once bounds are known. <strong className="text-snow">~70%.</strong>
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">More building &ldquo;type&rdquo; variety</p>
              <p>New archetypes, not just recolors — more creative than mechanical, staying on Sonnet.</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">Names + floating labels</p>
              <p>
                Gemini Flash generates the name banks, but I&apos;ll personally review the profanity
                blocklist rather than delegate it. Names — English and Katakana both — will be{" "}
                <em>invented</em> pseudo-words from syllable recombination, not real dictionary words: real
                words (especially Japanese, which I can&apos;t fully vet for unintended meaning) carry a
                rude-collision risk a nonsense generator doesn&apos;t. <strong className="text-snow">~65%</strong> on the generator;
                the blocklist review stays with me regardless of tier.
              </p>
            </ManifestItem>

            <ManifestItem num="07" title="3-letter initials, profanity-filtered, floating over your pawn" tier="sonnet" confidence="75%">
              <p>
                The filter list is a judgment call with real kid-safety stakes — I&apos;ll curate that
                myself, not delegate it. The mechanical half (text input UI, floating name-sprite
                rendering) goes to fleet once I&apos;ve built a shared text-sprite helper, which the
                leaderboard and building-name work below will also reuse.{" "}
                <strong className="text-snow">75%</strong> on that mechanical half.
              </p>
            </ManifestItem>

            <ManifestItem num="08" title="Spinning, pulsing rooftop coin on every building" tier="fleet" confidence="75%">
              <p>
                Pure mechanical Three.js animation —{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">rotation.y += dt*speed</code>, scale
                following a sine pulse. The effect-trigger name broadcast (&ldquo;PLAYERNAME triggered X
                MODE&rdquo;) is really part of the orb-effects framework below and sequences after it.
              </p>
            </ManifestItem>

            <ManifestItem num="09" title="Session leaderboard — overlay, 3D billboard, new-leader banner" tier="sonnet" confidence="65%">
              <p>
                Score isn&apos;t currently broadcast in multiplayer state at all — this touches the core
                relay message shape, so the first wiring pass stays on Sonnet. Once that&apos;s in, and the
                text-sprite/billboard helper exists (shared with items 6 and 7), the billboard rendering
                itself is fleet-able at roughly <strong className="text-snow">65%</strong>.
              </p>
            </ManifestItem>

            <ManifestItem num="10" title="Streets read as pure black — want dark grey definition" tier="fleet" confidence="90%+">
              <p>
                Unlike the building-facade fix, which needed a raw-shader root-cause dig, the road and
                sidewalk use plain <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">MeshStandardMaterial</code> — they already respond
                normally to lighting. This is a two-line color bump. Trivial enough I might just fix it
                directly regardless of who else touches this list.
              </p>
            </ManifestItem>

            <ManifestItem num="11" title="Car honks, plus missing collision sounds by type" tier="fleet" confidence="70%">
              <p>
                The honk mechanic already exists — quiet and probabilistic by design — you may just not
                have caught one yet, or it&apos;s tuned too quiet; I&apos;ll do a quick live-audio check
                myself first. The missing sounds (player-vs-building has none at all; player-vs-player soft
                contact has none) follow an existing bump/knock template exactly. Good &ldquo;copy this
                pattern for two more cases&rdquo; fleet task.
              </p>
            </ManifestItem>

            <ManifestItem num="12" title="Add trucks and jeeps to traffic" tier="fleet" confidence="65%">
              <p>
                New procedural box-based meshes following the existing car-mesh pattern are fleet-friendly.
                I want a second look at whether bigger vehicles need their own collision radius, so
                knockback and blocking still feel consistent against the smaller cars.
              </p>
            </ManifestItem>

            <ManifestItem num="13" title="Right trigger also fires the web, Spider-Man-style" tier="fleet" confidence="90%">
              <p>
                A one-line addition to the existing gamepad web-held check. Basically free — I might just
                do this one directly.
              </p>
            </ManifestItem>

            <ManifestItem
              num="14"
              title="Orb power-ups — every effect gets a you-only AND an everyone version"
              tier="opus"
              confidence="framework"
              defaultOpen
            >
              <p>
                <strong className="text-snow">Finalized 2026-07-03.</strong> The single biggest, most
                interconnected item on the list — now bigger, since almost every effect ships as two
                separate pickups (a solid orb for you-only, the same orb with a rotating halo ring for
                everyone). The framework — active-effect state, 30-second timers, stacking, torus
                duration-extenders, multiplayer broadcast — plus the physics-heavy effects (energy blast,
                pong mode, bomber, ghost, web-anywhere) need to not regress car, player, and building
                collision while they&apos;re at it. Staying on Claude.
              </p>
              <p>
                Once that scaffolding exists, the simple effects become genuinely fleet-delegable as
                isolated &ldquo;add one more effect to the framework&rdquo; tasks — each roughly{" "}
                <strong className="text-snow">60–70%</strong> with a precise per-effect prompt, since the
                you/everyone plumbing is identical every time (self-apply vs. broadcast-and-everyone-
                applies-to-self, reusing the joust/knock relay pattern already built).
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">Locked design notes from this round</p>
              <p>
                <strong className="text-snow">Fly</strong> is full Superman flight — gravity is disabled
                entirely while active, not just floaty. Distinct from the new low-gravity idea below, which
                keeps gravity but weakens it.
              </p>
              <p>
                <strong className="text-snow">Pong mode</strong> and <strong className="text-snow">energy blast</strong> both fire
                forward from the jousting stick, not omnidirectional — pong mode launches ball projectiles
                dead ahead, energy blast is a forward beam. Same launch-origin/direction convention as the
                existing web-fire aim logic, so this reuses code that already exists.
              </p>
              <div className="mt-3 overflow-x-auto rounded-lg border border-line">
                <table className="w-full min-w-[520px] border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wider text-mist/60">
                      <th className="px-3 py-2">Effect</th>
                      <th className="px-3 py-2">You-only</th>
                      <th className="px-3 py-2">Everyone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Giant", "10× scale, your collision", "server-wide giant free-for-all"],
                      ["Tiny", "you shrink", "everyone shrinks"],
                      ["Fly (Superman)", "no gravity, just you", "whole city floating, no gravity"],
                      ["Low-gravity (new)", "huge floaty jumps, gravity still applies", "whole city moonwalks"],
                      ["Speed", "you move at 2×", "everyone at 2×, chaos"],
                      ["Super jump", "your jumps 5×", "everyone's jumps 5×"],
                      ["Invincibility", "you can't die", "nobody can die — goofy stalemate"],
                      ["Fire", "you explode anyone you touch", "mutual — everyone explodes everyone on contact"],
                      ["Energy blast", "your stick fires a forward beam", "everyone's stick fires a beam"],
                      ["Pong mode", "balls launch forward from your stick", "everyone launches balls"],
                      ["Bomber", "you drop bombs", "everyone drops bombs"],
                      ["Ghost (new)", "you pass through everything", "whole city no-collision free-for-all"],
                      [
                        "Web-anywhere (new)",
                        "your web always finds a phantom anchor",
                        "nobody ever whiffs a web, city-wide swing party",
                      ],
                      ["Magnet (new)", "pulls nearby orbs toward you", "pulls all players toward the trigger point — dogpile"],
                      ["Confetti (new)", "cosmetic trail, no gameplay effect", "everyone trails confetti"],
                      ["Zombie summon (new)", "a personal chaser hunts your target", "triggers the full zombie wave early, city-wide"],
                    ].map((row) => (
                      <tr key={row[0]} className="border-b border-line last:border-none">
                        {row.map((cell, i) => (
                          <td key={i} className={`px-3 py-2 align-top ${i === 0 ? "font-semibold text-snow" : "text-mist"}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                <strong className="text-snow">Three exceptions that don&apos;t take the you/everyone split:</strong>
              </p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>
                  <strong className="text-snow">Time-freeze</strong> — self-only only; an &ldquo;everyone&rdquo; version is just
                  normal time, contradicting the point (the existing noir/slow-time powerup already covers
                  that case).
                </li>
                <li>
                  <strong className="text-snow">Disco / city recolor</strong> — everyone-only; it&apos;s an environment
                  effect, so &ldquo;only you see it&rdquo; isn&apos;t meaningful.
                </li>
                <li>
                  <strong className="text-snow">Shrink-tag</strong> — a genuinely different mechanic, not a variant of
                  tiny-mode: touch another player to shrink <em>them</em> specifically, an offensive targeted
                  tool rather than a self/everyone buff.
                </li>
              </ul>
              <p className="rounded border-l-2 border-mist/40 bg-ink/40 py-2 pl-3 text-xs">
                All new ideas and the you/everyone split confirmed as-is, 2026-07-03 — no longer a proposal.
              </p>
            </ManifestItem>

            <ManifestItem num="15" title="Jousting stick prop, fix head-stomp, add stick-poke kill" tier="sonnet" confidence="both mechanisms">
              <p>
                Per your answer, both should work: landing on someone&apos;s head, or poking them with the
                stick from any angle.
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">Visible stick prop</p>
              <p>
                Pure cosmetic geometry — fleet, <strong className="text-snow">~80%</strong>.
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">Head-stomp reliability</p>
              <p>
                The fix from earlier this session is confirmed live, so this isn&apos;t a shipping bug. Best
                working theory: the target&apos;s rendered position lags the true position by a network
                tick or two, and a 0.9-unit height band is tight enough that lag alone can miss it most of
                the time. Needs a real diagnosis before I just blindly widen numbers — staying on Sonnet.
              </p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-mist/60">Stick-poke as a new kill trigger</p>
              <p>
                Needs actual interaction design: how does a poke coexist with the existing soft-push and
                hard-knock tiers so it doesn&apos;t just always win over ordinary contact? Not
                fleet-appropriate for the design call; implementation after that could move to fleet.
              </p>
            </ManifestItem>

            <ManifestItem num="16" title="Start-screen copy — clarify points come from more than swinging" tier="fleet" confidence="95%">
              <p>A copy edit. Free — might just do this one directly too.</p>
            </ManifestItem>
          </div>

          <div className="mt-8 rounded-2xl border border-teal/30 bg-gradient-to-b from-panel/70 to-panel/30 p-6 md:p-7">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Recommended first test</p>
            <h3 className="mt-3 text-lg font-bold text-snow">Five cheap, high-confidence tickets to try the fleet on first</h3>
            <ol className="mt-4 flex flex-col gap-2 text-sm text-snow">
              {[
                "Streets too black → two-line color bump (item 10)",
                "Right trigger also fires web (item 13)",
                "Start-screen copy update (item 16)",
                "Missing collision sounds, copying the existing pattern (item 11)",
                "Rooftop coin spin/pulse animation, visual only (item 8)",
              ].map((item, i) => (
                <li key={item} className="flex gap-3">
                  <span className="font-mono text-xs text-teal">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
              All five are mechanical, well-specified, and low blast-radius — easy to eyeball pass or fail
              against. If those land clean, the next tier up — border-wall bounce, truck and jeep geometry,
              individual orb effects once the framework exists — is where the real token savings start
              compounding.
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
