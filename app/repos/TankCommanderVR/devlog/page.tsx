import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";
import DevlogNote from "@/components/DevlogNote";
import ManifestItem from "@/components/ManifestItem";
import { repos } from "@/lib/data";

const repo = repos.find((r) => r.slug === "TankCommanderVR")!;

export const metadata: Metadata = {
  title: "Tank Commander — Devlog",
  description:
    "A physically-operated VR tank cockpit, 100% procedural, built entirely in GDScript — the inverted-normals bug that took 70% of the game's geometry down with it, and the real overnight task-routing manifest from a July 2026 playtesting pass.",
  alternates: { canonical: "/repos/TankCommanderVR/devlog" },
};

export default function TankCommanderVRDevlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
      <Ethereal variant="aurora" />
      <Reveal>
        <Link href="/repos/TankCommanderVR" className="font-mono text-sm text-mist hover:text-teal">
          ← Tank Commander
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-amber">Devlog</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Building Tank Commander</h1>
        <p className="mt-5 text-xl leading-relaxed text-mist">
          Made for Ani 🧡 — a one-man turret you sit inside and actually operate: flip the battery
          master, hold the starter until the engine catches, grab the twin tillers, cycle the breech
          lever, arm the rocket console behind its safety cover. Every texture, sound, voice line, and
          piece of geometry — cockpit included — is generated at runtime in pure GDScript. Nothing is
          imported.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist">
          That commitment to building everything from scratch is also where the worst bug of the
          project&apos;s life came from — and it took someone actually inside the headset to catch it,
          not a single automated check.
        </p>
      </Reveal>

      {/* ── Origins ───────────────────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-14 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">01 · Origins</p>
          <h2 className="mt-3 text-2xl font-bold">A cockpit first, a game around it second</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              The design brief was the cockpit, not the battlefield: sit inside a real armored-vehicle
              crew station and physically operate every control — a battery master switch, a starter
              you have to hold until the engine catches, twin tillers for the tracks, a turret
              joystick, a breech lever you cycle by hand to reload, a rocket console behind a
              flip-up safety cover. The battlefields, enemy waves, and the eventual jeep, plane,
              biplane, helicopter, and on-foot runner mode all got built around that one physically-
              operated seat, not the other way around.
            </p>
            <p>
              Nothing in the game is an imported asset — every mesh comes out of a custom{" "}
              <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-sm text-amber">MeshKit</code>{" "}
              builder at runtime, every texture is procedurally generated, every sound and voice line
              is synthesized. That constraint is also why the biggest bug below was even possible: with
              no imported reference geometry to compare against, the entire pipeline — generator and
              validator alike — could quietly agree on the same wrong convention for a long time before
              anyone noticed.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Growing past one seat ─────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-8 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">02 · Feel</p>
          <h2 className="mt-3 text-2xl font-bold">Growing past one seat</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              The tank cockpit went through several real-front-view passes before it actually read
              correctly in stereo — the turret&apos;s exterior armor box never had an opening cut into
              it at all, so no amount of widening the interior slit could ever have shown terrain
              through it. The fix cut an actual driver&apos;s window through the exterior plate, shrank
              and repositioned the breech so it stopped intruding on the driver&apos;s space (the rear
              face had been sitting five centimeters from the eye), and moved the rocket pods from
              directly over the side hatches to a rear mount clear of the sightlines — verified with a
              seven-angle seated render sweep instead of a single forward-only shot.
            </p>
            <p>
              A drivable jeep followed, mirror-imaged from the tank&apos;s own thumbstick conventions —
              left stick drives and steers, right stick swings a full-360 rear-mounted gun — with a
              steering wheel grip, throttle lever, and a red cannon button standing in for the tank&apos;s
              breech ritual at jeep speed. Later still, on-foot mode got real traversal: terrain
              collision bodies became climbable across every cliff and rim, and the grapple&apos;s attach
              mask widened from a set of world-object layers that had never actually been populated to
              any solid surface in the game — cliffs, buildings, vehicles, all of it.
            </p>
            <p>
              Some of that traversal work caught its own bug in the same pass: a new render-check tool
              built to verify the dressed-up soldier avatars found that the arm-IK solver mixed
              world-space shoulder positions with avatar-local hand targets, so arms solved toward the{" "}
              <em>map origin</em> instead of the avatar — invisible in an origin-staged test scene,
              blatant (pole-arms pointing at nothing) for an NPC gunner, a remote co-op player, or your
              own body in third person.
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
            One bug here is the whole reason this section exists: it took a human with two eyes in a
            headset to catch what every automated tool in the project had already agreed was fine.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <DevlogNote title="'I have depth perception' — 70% of the game's normals were inverted" tag="rendering">
              <p>
                Alex flagged it from inside the headset, against every automated check saying otherwise:
                roughly <strong className="text-snow">70% of the game&apos;s geometry</strong> read as
                inside-out. The reason no tool had caught it is the reason it was bad —{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  mesh_audit.gd
                </code>
                , the project&apos;s own automated winding validator, had been written with the same
                counter-clockwise/right-hand-rule convention as the mesh generator it was checking. It
                didn&apos;t just miss the bug — it actively blessed backwards meshes and flagged the one
                correctly-imported <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">.glb</code>{" "}
                in the project as the broken one.
              </p>
              <p>
                The empirical proof, once someone went looking: a single right-hand-rule-wound triangle
                with back-face culling on renders <em>only from behind its own normal</em>. Godot&apos;s
                front faces are clockwise — the OpenGL habit most engines share is backwards here. That
                one fact meant fixing{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  MeshKit.box()
                </code>{" "}
                (emitting the wrong order on every box in the game — same silhouette on a flat
                screenshot, blatant in VR stereo),{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  MeshKit.cyl()
                </code>{" "}
                (an earlier &ldquo;fix,&rdquo; guided by the same wrong audit tool, had flipped cylinders
                from correct to wrong — restoring the pre-fix order was the actual repair), and{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  MeshKit.prism()
                </code>{" "}
                (the one shape that was already correctly wound — its stored lighting normals were
                pointing inward and needed negating instead). A commit marked as a breaking change,
                a new verification stack (a one-triangle ground-truth render, a per-triangle winding
                math table, a zero-AI whole-project facing sweep script), and Alex&apos;s own eyes as the
                real acceptance test — not the tool that had been wrong the whole time.
              </p>
              <p className="rounded border-l-2 border-mist/40 bg-ink/40 py-2 pl-3 text-xs">
                A stopgap shipped first while the real per-shape fixes were still being chased down: a
                global cull-mode override on every material entering the scene tree, so ~40 flipped-normal
                sites stopped being visibly broken while the actual winding-order bugs got fixed one at
                a time behind it.
              </p>
            </DevlogNote>

            <DevlogNote title="Every physical cockpit control, unit-tested and never once wired up" tag="input">
              <p>
                The battery switch, starter, tillers, breech lever, rocket cover — every physical control
                in the cockpit was built and unit-tested from day one, and for most of the project&apos;s
                life, none of them actually worked in the headset. The grab/poke proximity code checked
                membership in a Godot group that, per a full search of the project&apos;s own git history,
                no control had ever actually joined —{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  add_to_group(&quot;vrcontrols&quot;)
                </code>{" "}
                was simply never called. One missing line had been quietly gating the hatch lever (and
                with it, entry into on-foot mode) for the entire life of the feature.
              </p>
              <p>
                A second, unrelated bug was compounding the same symptom from underneath: Godot&apos;s{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  OpenXRInterface
                </code>{" "}
                silently renames pose actions to its own internal engine names —{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  grip_pose
                </code>{" "}
                becomes <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">grip</code>,{" "}
                <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">
                  aim_pose
                </code>{" "}
                becomes <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">aim</code>{" "}
                — and the project&apos;s controller nodes had been requesting the pre-rename action
                names, matching nothing. That one is the real root cause behind an invisible
                controller-mode hand glove across four separate playtesting rounds, on top of the dead
                hatch-lever grabs and a frozen on-foot movement bug that all looked, from the outside,
                like the same single problem.
              </p>
            </DevlogNote>

            <DevlogNote title="Aim pose vs. hand tracking: a fight over who owns the menu ray" tag="Quest 3S">
              <p>
                Quest 3S runs hand tracking concurrently with physical controllers, which the menu-ray
                code hadn&apos;t accounted for — its hand-tracking aim branch kept hijacking the ray even
                while the player was holding controllers, so the pointer aimed up at the ceiling instead
                of out at the menu and nothing could be selected. The fix gives controller aim pose
                absolute priority the instant a controller is actually tracked, rather than letting
                whichever branch runs second in a frame win by accident.
              </p>
            </DevlogNote>
          </div>
        </div>
      </Reveal>

      {/* ── Going multiplayer ────────────────────────────────────── */}
      <Reveal>
        <div className="glass mt-8 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-grape">04 · Multiplayer</p>
          <h2 className="mt-3 text-2xl font-bold">A persistent host, and logs that don&apos;t need a cable</h2>
          <div className="mt-4 space-y-4 leading-relaxed text-mist">
            <p>
              LAN co-op already existed — one headset drives and mans the machine guns, the other runs
              the turret, both rendered to each other as fully procedural avatars — but every session
              needed a local host actually on the network to find. The fix ported{" "}
              <Link href="/repos/swing-city" className="text-teal underline decoration-teal/40 underline-offset-2 hover:decoration-teal">
                Swing City&apos;s
              </Link>{" "}
              Cloudflare Worker + Durable Object relay pattern almost directly: no server-side physics
              or game state, every client trusted to report its own position and effects, the WebSocket
              Hibernation API so an idle room of open sockets never pins the Durable Object in memory.
              What&apos;s different here is the relay is deliberately generic — instead of hardcoding
              Tank Commander&apos;s own message types into the Worker the way Swing City&apos;s joust/
              poke/knock protocol is baked into its relay, this one re-broadcasts <em>any</em> message
              type it doesn&apos;t specially recognize, stamped with the sender&apos;s id. Round timers,
              scoring, host-granted map/mode/bot control, seat-switching — all of that can be added
              client-side without ever touching or redeploying the Worker itself.
            </p>
            <p>
              The same Worker took on a second, unrelated job: a plain <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">POST /logs</code>{" "}
              endpoint backed by a KV namespace, so crash logs and session data can come in from a
              headset that isn&apos;t even on the same network as the machine debugging it — no adb
              cable, no requirement that every test headset physically be in the room. Wireless{" "}
              <code className="rounded bg-ink/60 px-1.5 py-0.5 font-mono text-xs text-amber">adb</code>{" "}
              over the LAN covers the rest: whichever headsets are on-site get paired once, then pulled
              from without a cable ever again.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Appendix: sample delegation manifest ─────────────────── */}
      <Reveal>
        <div className="mt-14">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">05 · Appendix</p>
          <h2 className="mt-3 text-2xl font-bold">Sample document: the overnight routing manifest</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-mist">
            After a full playtesting pass in July 2026 — headsets full of crash logs, a page of
            gameplay notes ranging from &ldquo;the jeep needs a steering wheel&rdquo; to &ldquo;host
            should feel like a god&rdquo; — the follow-up list got routed by who should actually build
            each piece: a Claude tier by difficulty, Gemini for research that shouldn&apos;t cost a
            token on the main run, or the local model fleet for the free, mechanical grunt work. This is
            the real routing document that came out of that pass, reproduced close to as-generated —
            an internal task-division artifact, not a feature list, kept here the same way Swing
            City&apos;s equivalent appendix is: a concrete example of what that delegation process
            actually looks like on a real project, run unattended overnight with a token budget in
            mind.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {[
              { label: "Fleet — local, free (Ollama)", dot: "bg-teal" },
              { label: "Gemini — research, no repo writes", dot: "bg-sky" },
              { label: "Sonnet — orchestrator + bulk work", dot: "bg-amber" },
              { label: "Opus — hardest reasoning only", dot: "bg-grape" },
              { label: "Fable — fast content & polish", dot: "bg-rose-400" },
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
            <ManifestItem num="01" title="Multiplayer join-crash — one player connecting crashes the other" tier="opus" confidence="genuine root-cause dig">
              <p>
                Symptom-only reports so far (&ldquo;in most cases, regardless of vehicle choice, in
                multiplayer you start with Tank&rdquo; is a strong hint the peer-spawn path and the
                crash share a cause). Needs a real dig through the net layer&apos;s peer-spawn sequence,
                not a guess-and-patch pass — staying on Opus.
              </p>
            </ManifestItem>

            <ManifestItem num="02" title="Round timer + scoring, host god-mode, shared vehicle seats" tier="opus" confidence="netcode design">
              <p>
                Three genuinely interconnected systems on top of the same relay: a Rec-Room-paintball-
                style round clock with live scoring, a host that can change map/mode/difficulty and spawn
                bots at any time, and co-op seating flexible enough that one player can run both halves
                of a vehicle solo, or two players can swap seats on a hotkey. All three ride the same
                generic relay message convention the Worker already supports — the design work is in the
                message shapes and host-authority rules, not the transport.
              </p>
            </ManifestItem>

            <ManifestItem num="03" title="Persistent-host fallback + wireless log gathering" tier="opus" confidence="deployed live mid-session">
              <p>
                Ported from Swing City&apos;s relay pattern doc directly — this is the piece described in
                the Multiplayer section above. Unusually, this one didn&apos;t stay purely delegated: the
                Cloudflare account login and first deploy needed a human in the loop for OAuth, so it got
                stood up live, smoke-tested end to end (relay fan-out, log upload, token-gated retrieval),
                and handed to the rest of the run as a working endpoint rather than a task on the list.
              </p>
            </ManifestItem>

            <ManifestItem num="04" title="Spider-Man powers gated behind a pickup, not always-on" tier="opus" confidence="rework of existing system">
              <p>
                The grapple-anywhere and world-climbing traversal already exists and already attaches to
                cliffs, buildings, and vehicles — see the Feel section above. What&apos;s missing is the
                gate: the ability should only turn on once a specific pickup is found, not be available
                from the start. Touches the same interaction and inventory code closely enough to want
                one careful pass rather than a bolt-on flag.
              </p>
            </ManifestItem>

            <ManifestItem num="05" title="Bulk playtest punch list — vehicles, weather, UI, onboarding" tier="sonnet" confidence="~20 items">
              <p>
                Everything well-specified enough to implement directly: consistent enter/exit across
                every vehicle, right-trigger-forward on all of them, a jeep steering wheel, fixed plane
                spawn facing, snap/smooth turn and sprint options for on-foot mode, a fog weather state,
                flowing and occasionally-erupting volcano lava with a matching no-grass palette, an
                attackable (and eventually killable) baby-room target, clearer avatar silhouettes with
                per-team coloring, a team mode alongside free-for-all, names floating over every avatar
                and vehicle, a pause-menu roster and score display, a single-player exemption from the
                wifi-required gate, broken lobby map previews, and a first-run splash screen.
              </p>
            </ManifestItem>

            <ManifestItem num="06" title="Energy drink crash + drink feedback, coffee effect" tier="sonnet" confidence="lead already found">
              <p>
                The energy drink crashing the game has a specific suspect: its action handler plays a
                sound and reaches into the on-foot body&apos;s sprint-boost method in the same call where
                it frees itself — a same-frame free-while-still-executing-your-own-signal-handler shape.
                Coffee, meanwhile, has no effect and no feedback at all — not a crash, just dead weight
                that needs an actual boost and a visible tell that it worked.
              </p>
            </ManifestItem>

            <ManifestItem num="07" title="More weapons, drink/coffee FX, cubemap fix, splash art" tier="fable" confidence="content, not systems">
              <p>
                Net-new weapons follow an existing pickable pattern closely enough to hand off directly.
                The energy drink and coffee need particles, sound, and (for the energy drink) a crushed-
                can mesh once it&apos;s actually consumed. The store page&apos;s six-sided cubemap has two
                wrong faces (ground and sky are fine) that just need regenerating. None of this touches
                game systems — it&apos;s art and juice layered on top of mechanics that already exist or
                are being built in parallel.
              </p>
            </ManifestItem>

            <ManifestItem num="08" title="Research: Quest username API, splash-screen patterns" tier="gemini" confidence="no repo writes">
              <p>
                Whether an in-headset build can actually read local and remote players&apos; Quest
                usernames is a platform-API feasibility question, not an implementation one — worth
                answering before any pause-menu roster work assumes it&apos;s possible. Splash-screen
                conventions and a review of the Cloudflare relay integration plan against its own
                pattern doc are the same shape: research that shouldn&apos;t spend a token of the main
                run&apos;s budget.
              </p>
            </ManifestItem>

            <ManifestItem num="09" title="Log triage, crash-pattern scan, changelog draft" tier="fleet" confidence="free, parallel">
              <p>
                Every headset log and crash dump collected this run gets parsed into a structured bug
                ledger by a local model, in parallel with everything else, at zero token cost. A second
                pass scans every script in the project for the shape of bug that already bit this
                project once — freed-node access, null dereference, a signal handler freeing the node
                it&apos;s still executing on.
              </p>
            </ManifestItem>
          </div>

          <div className="mt-8 rounded-2xl border border-teal/30 bg-gradient-to-b from-panel/70 to-panel/30 p-6 md:p-7">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">Priority order for the run</p>
            <h3 className="mt-3 text-lg font-bold text-snow">Crashes first, then the netcode core, then everything else</h3>
            <ol className="mt-4 flex flex-col gap-2 text-sm text-snow">
              {[
                "Crash fixes — the join-crash and the energy-drink crash",
                "Multiplayer core — rounds, scoring, host god-mode, shared seats",
                "Vehicle and on-foot UX — enter/exit, steering wheel, plane facing, movement options",
                "Weather and content — fog, volcano lava, weapons, drink/coffee effects",
                "Polish — cubemap fix, splash screen, names and team colors",
              ].map((item, i) => (
                <li key={item} className="flex gap-3">
                  <span className="font-mono text-xs text-teal">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
              Run unattended overnight, in batches — build, commit, version-bump per landed feature
              rather than per edit — with a hard rule to stop cleanly and flag a blocker rather than
              loop on it. The goal was never to burn the token budget proving a point; it was to have as
              much of the punch list actually done, and every headset&apos;s logs actually collected, by
              morning.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-14 flex flex-wrap gap-3">
          <a
            href={repo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            View on GitHub →
          </a>
          <Link
            href="/repos/TankCommanderVR"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-grape/60"
          >
            Back to the repo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
