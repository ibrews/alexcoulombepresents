import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Ethereal from "@/components/Ethereal";

export const metadata: Metadata = {
  title: "Fable Showcase — Devlog",
  description:
    "A fresh UE 5.8 project, handed to Claude Fable 5.1 for one night with ECABridge and Forage. What it built, what broke, and what came out of it.",
  alternates: { canonical: "/lab/fabel-showcase/devlog" },
  openGraph: {
    title: "Fable Showcase — Devlog",
    description:
      "A fresh UE 5.8 project, handed to Claude Fable 5.1 for one night with ECABridge and Forage. What it built, what broke, and what came out of it.",
    url: "/lab/fabel-showcase/devlog",
    type: "website",
    images: [
      {
        url: "/lab/fabel-showcase/hub-flythrough-poster.webp",
        width: 1280,
        height: 720,
        alt: "A moodily lit museum hall with glowing portal arches down both sides and a metal pyramid centerpiece on the floor.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fable Showcase — Devlog",
    description:
      "A fresh UE 5.8 project, handed to Claude Fable 5.1 for one night with ECABridge and Forage.",
    images: ["/lab/fabel-showcase/hub-flythrough-poster.webp"],
  },
};

type Shot = {
  file: string;
  alt: string;
  caption: string;
  outcome: "win" | "miss" | "fix";
};

type Chapter = {
  number: string;
  title: string;
  intro: string;
  shots: Shot[];
};

const chapters: Chapter[] = [
  {
    number: "01",
    title: "Sourcing the gallery",
    intro:
      "Before any building started, two establishing shots from the Museum Environment Kit confirmed the purchased asset pack actually read as a museum — the model's starting material, not anything it built itself.",
    shots: [
      {
        file: "01-museum-first-look.webp",
        alt: "A grand marble museum gallery with barrel-vaulted glass ceiling, framed portraits on the walls, a marble bust in the foreground, and a glazed pyramid structure sitting on the floor.",
        caption:
          "The Museum Environment Kit's demo hall, pulled in through Forage and dropped straight into the project: coffered glass ceiling, Corinthian columns, hung portraits, velvet-roped benches, and a marble bust close to camera. This is the raw asset pack before any of it was built into the hub.",
        outcome: "win",
      },
      {
        file: "02-museum-second-look.webp",
        alt: "The same museum hall seen from behind a foreground column, with a round portrait of a woman in earrings hanging center-frame and smaller paintings lining the side wall.",
        caption:
          "A second angle from the same kit, columns framing a round portrait down the hall. Two quick establishing shots like this were how the session confirmed the pack looked like a museum before committing to build the hub inside it.",
        outcome: "win",
      },
    ],
  },
  {
    number: "02",
    title: "Building the hub",
    intro:
      "The concept: a museum gallery where each doorway is a portal to a showcase level for one category of the tool surface. Getting there took a working single-portal prototype, a row of them down both walls, and two rounds of fixing that same row after it broke in two different ways.",
    shots: [
      {
        file: "03-hub-overview-attempt.webp",
        alt: "A distorted, tilted view along a curved metal-and-glass railing, looking down through gridded panes at a herringbone floor and a wall of small hung paintings far below.",
        caption:
          "Logged as a 'top-down of the hub's floor plan' — it isn't. This is a steep, glancing shot squeezed between a glass balustrade and a skylight frame, and it never gave a usable overview of the hub layout.",
        outcome: "miss",
      },
      {
        file: "04-portal-arch-prototype.webp",
        alt: "A free-standing bronze, arched doorway frame filled edge-to-edge with a glowing white marble-veined panel, standing on the gallery's parquet floor between two portraits.",
        caption:
          "The first working portal prototype: a swept bronze arch with an animated, glowing marble face standing upright inside it. This is the single-portal shape the hub's eight showcase doorways were later built from.",
        outcome: "win",
      },
      {
        file: "05-portal-row-early.webp",
        alt: "A long museum hall viewed down its center aisle, with two glowing bronze portal arches standing along each side wall among the hung paintings, benches and chairs in the middle of the floor.",
        caption:
          "An early pass at multiplying the single arch into a row of portals down both sides of the gallery. The arches are placed and glowing, but nothing readable yet marks which showcase each one leads to.",
        outcome: "win",
      },
      {
        file: "06-portal-pools-on-floor.webp",
        alt: "The same portal-lined hall, but each archway now casts a flat colored oval of light lying on the floor and ceiling instead of a glowing upright doorway face, and the floating text labels above the arches read backwards and upside down.",
        caption:
          "Two failures in one frame: the portal's glowing face collapsed into flat colored ellipses lying on the floor and ceiling, and the category labels above the arches came out mirrored and upside down — only one of five readable normally.",
        outcome: "miss",
      },
      {
        file: "07-hub-labeled-portals.webp",
        alt: "The finished hub hallway with upright glowing portal arches down both walls, one showing a readable floating text label reading 'Surface & Light' near it.",
        caption:
          "A later iteration of the same hall: portal faces upright and glowing again, not floor pools, and at least one arch showing a correctly oriented label — 'Surface & Light' — matching one of the showcase categories.",
        outcome: "fix",
      },
      {
        file: "08-portal-teleport-pie.webp",
        alt: "A gray reference mannequin stands on a bare, untextured concrete plaza under an open sky, in front of a bronze archway with a glowing white panel, inside a running Play-in-Editor window.",
        caption:
          "A Play-in-Editor test after walking the character through a portal: the teleport works, the arch is visible from the far side — but the destination is an empty gray box level with no walls or texture yet. The mechanic is proven; the level behind it isn't built.",
        outcome: "win",
      },
    ],
  },
  {
    number: "03",
    title: "Terrain & Weather",
    intro:
      "The environment level was the first one handed to a subagent working alone, and it's also the roughest of the five — dark, pit-shaped at first, and hit by a rendering bug serious enough to turn the whole level black.",
    shots: [
      {
        file: "09-landscape-checkerboard.webp",
        alt: "A close, low-angle view of rolling terrain under a blue sky, with the entire ground surface rendered as a fine gray-and-white checkerboard pattern instead of a landscape texture.",
        caption:
          "The terrain shape — a domed rise with a lower shelf — reads correctly, but the auto-blend landscape material renders as an even checkerboard dither with no visible dirt, grass, or rock texture. Logged as unresolved after ruling out missing textures, compile errors, and Nanite.",
        outcome: "miss",
      },
      {
        file: "10-viewport-gone-black.webp",
        alt: "An almost entirely solid black frame with two tiny faint white flecks near the center and nothing else visible.",
        caption:
          "A capture taken while diagnosing the level: solid black, no terrain, sky, or geometry visible at all. The whole level — including the live editor viewport — went black after a post-process exposure edit and stayed that way until the level was reopened.",
        outcome: "miss",
      },
      {
        file: "11-sand-mesa-hazy.webp",
        alt: "A sandy plateau seen against a hazy golden-yellow sky, silhouetted trees along both edges, scattered rocks, and a pale strip of water on the horizon.",
        caption:
          "After reshaping the level from a pit into a sand mesa in shallow water: sandy ground, tree silhouettes, and distant water are all present, but the whole scene is heavily overexposed into a flat gold haze — a rough, functional pass, not a finished lighting look.",
        outcome: "fix",
      },
    ],
  },
  {
    number: "04",
    title: "Particles & Motion",
    intro:
      "Niagara turned out to have its own blind spot: none of the static screenshot commands tick the running world, so a plinth full of particles looks completely inert until you catch it live in Play-in-Editor.",
    shots: [
      {
        file: "12-plinth-hall-labels.webp",
        alt: "A dark hall viewed down its length, five plinths in a row each lit by a colored spotlight-like pool on the floor and ceiling, with readable text labels including 'Authored: Embers,' 'Authored: Cold Motes' and 'Library: Effect A/B/C.'",
        caption:
          "The Niagara showcase hall with its five plinths, photographed outside Play-in-Editor so no particles are emitting yet. All five text labels read correctly here, right-side up and legible — a fix over the mirrored-text problem seen elsewhere in this build.",
        outcome: "win",
      },
      {
        file: "13-giant-mirrored-text.webp",
        alt: "A camera looking almost straight down at a hall floor covered by a single word in huge backwards, upside-down white letters, with colored oval light pools above and below it.",
        caption:
          "A label test gone wrong: text meant to read 'Authored: Embers' next to its plinth instead came out mirrored and inverted, blown up to cover most of the floor in giant letters. The 'giant mirrored text' failure mode made it into this build's own lessons-learned notes.",
        outcome: "miss",
      },
      {
        file: "14-embers-particles-pie.webp",
        alt: "A gray-and-white checkerboard-textured cube glows on a plinth in the foreground while, further down the hall, a second plinth shows visible sparkling white and pink-purple particles bursting upward; overhead text reads backwards.",
        caption:
          "A Play-in-Editor capture — the only way this build found to make Niagara particles actually visible. Real particles are genuinely emitting around the second plinth, but the foreground cube still sits on the default gray checkerboard material and the overhead label is still mirrored. Both were fixed later; this frame predates the fixes.",
        outcome: "win",
      },
      {
        file: "15-ring-of-flames-pie.webp",
        alt: "A cube on a plinth glows inside a pink circular floor pool, with orange spark particles drifting off its top edge and, behind it, a second plinth showing green and blue-white particle bursts.",
        caption:
          "Another Play-in-Editor capture, this time showing warm orange embers lifting off the near plinth's glowing top edge and a second effect emitting green and white sparks behind it — particles from both an authored system and a library effect genuinely simulating, not sitting inert as editor-preview icons.",
        outcome: "win",
      },
      {
        file: "16-hero-silhouette-doorway.webp",
        alt: "A dark silhouette of a humanoid figure stands facing a bright, glowing archway at the end of a dim wood-paneled corridor, inside a running Play-in-Editor window.",
        caption:
          "A quieter, moodier capture from later in the pass: the player character stands backlit in the hall's return-portal archway, the rest of the space fallen into shadow. No visible bugs here — a calmer note to end the chapter on.",
        outcome: "win",
      },
    ],
  },
  {
    number: "05",
    title: "Surface & Light",
    intro:
      "Eight node-authored materials laid out on a table for comparison, in a room that never got a front wall — and an exposure problem a late fix didn't fully undo.",
    shots: [
      {
        file: "17-materials-room-overexposed.webp",
        alt: "A washed-out white interior with a patterned cream carpet at the bottom of frame, blown-out white ceiling and wall panels in the middle, and open blue sky visible where a wall or window would normally be.",
        caption:
          "The materials showcase room, badly overexposed to the point that the ceiling and back wall read as flat white with almost no detail, while open sky is visible past the table where a front wall was never built. This room reads consistently overexposed across nearly every capture taken in it.",
        outcome: "miss",
      },
      {
        file: "18-hologram-material-closeup.webp",
        alt: "A row of spheres and cubes on a white table against a blue sky background, with a translucent teal glass cube labeled 'Hologram' on the left and a plain gray sphere in the middle.",
        caption:
          "A closer look at three of the eight hand-authored materials: a translucent cyan 'Hologram' cube, a plain matte gray sphere, and a pale lavender pair at the right edge. The blue sky filling the background shows the room's missing front wall again from this angle.",
        outcome: "win",
      },
      {
        file: "19-eight-materials-row.webp",
        alt: "A full row of eight sphere-and-cube material pairs lined up on a white table under a black-and-gray coffered ceiling, with 'Velvet' and 'FrostedGlass' text labels visible and open sky beyond the table's far edge.",
        caption:
          "The complete row of eight node-authored materials — car paint, brushed metal, frosted glass, velvet, and others — laid out for comparison, with two labels legible. The whole table still reads pale and washed out; a post-process exposure fix added late in the session didn't visibly change these particular captures.",
        outcome: "miss",
      },
    ],
  },
  {
    number: "06",
    title: "Sound & Signal",
    intro:
      "The audio hall was supposed to read as a dark temple nave. It shipped instead as a sunlit corridor open at both ends — until the last capture of the night, when the open end finally got closed off.",
    shots: [
      {
        file: "20-audio-hall-daylight.webp",
        alt: "A bright, sunlit stone corridor with a blue-tinted ceiling opens onto a pale sandy floor and a blue sky-and-sea horizon, with a small white cube sitting alone in the distance.",
        caption:
          "The audio hall, meant to read as a dark temple nave, instead flooded with bright daylight and open sky visible straight through both open ends of the corridor. The open-ended nave was logged as the single biggest gap against the 'dark temple' brief — dimming the sun and skylight alone couldn't compensate for walls that were never closed off.",
        outcome: "miss",
      },
      {
        file: "21-drone-plinth-mirrored-sign.webp",
        alt: "A glowing white portal archway stands next to a small stone plinth on a pale sandy floor, with backwards, mirrored white text visible on the blue ceiling above.",
        caption:
          "The return portal beside the drone-music plinth, still lit by open daylight rather than the intended warm torchlight, with more of this build's mirrored ceiling text visible above.",
        outcome: "miss",
      },
      {
        file: "22-audio-hall-closed.webp",
        alt: "A dim, deep-blue-tinted stone corridor now ends in a solid stone wall between two square columns, with a small pale cube-shaped plinth glowing faintly alone on the floor in the center.",
        caption:
          "The audio hall's last capture of the night: the gap that was letting daylight flood in is now closed off with a solid stone wall, and the space reads in a dim, cool blue instead of the bright sunlit look of the earlier shots. The open-ended-nave and daylight-leak problems are visibly addressed here, even though little else reads clearly in the dark.",
        outcome: "fix",
      },
    ],
  },
];

const flythroughStills: Shot[] = [
  {
    file: "23-flythrough-preview-still.webp",
    alt: "A moodily lit museum hall with pink and pale-green glowing portal arches on either side, a metal pyramid centerpiece on the floor, and a framed portrait of a woman on the back wall.",
    caption:
      "A Movie Render Queue preview still from partway through the final hub flythrough sequence: warm gallery lighting, colored portal arches down both sides, and the pyramid centerpiece and portrait recur from the very first establishing shots. This is the render pipeline's own preview frame, used to check framing and lighting before committing to the full render.",
    outcome: "win",
  },
  {
    file: "24-flythrough-frame-255.webp",
    alt: "A low, floor-level view down the gallery hall between two glowing pink and white portal arches, with faint colored streaks of motion blur near the center of the frame and a portrait visible on the back wall.",
    caption:
      "A single rendered frame from the third and final flythrough render, shot low near the floor between two portal arches. Faint pink and green ghosting streaks near the center are consistent with the camera-jerk and motion-blur issues the project's own video QA pass flagged around the same window — though a single still can't confirm that's the same defect versus ordinary motion blur.",
    outcome: "fix",
  },
];

const lessons = [
  "Claude Code's own Unreal MCP connection failed to come up at boot and never reconnected for the rest of the run — everything after that went through ECABridge's own Python client instead, one call at a time.",
  "None of the static screenshot commands tick the running world. Niagara particles, and anything else that's animating, only show up in a capture taken during Play-in-Editor.",
  "A freshly created mesh renders on the default gray checkerboard material until something is actually assigned to it — an easy 'is this even broken' moment the first few times it happens.",
  "Landscape materials that blend based on painted layer weights render solid black with nothing painted yet. Start with a plain material, paint the blend later.",
  "A swept polygon mesh builds flat in one plane — the wrong roll value buries it face-down in the floor instead of standing it up. The fix was a single sign flip, once we knew to look for it.",
  "Text3D handedness isn't consistent: a standalone actor and one parented under a Blueprint root can need opposite yaw values to read correctly. Mirrored, upside-down text showed up more than once before that clicked.",
  "A manual post-process exposure edit can leave an entire level rendering solid black in every capture path — including the live editor viewport — until you close and reopen it. Auto-exposure bias only, from now on.",
  "Subagents sharing one running editor have to work strictly one at a time, each pinned to its own level. Two open levels in the same editor at once is how you get spawns landing in the wrong place.",
  "A failed 'create new level' call doesn't fail loudly — it silently leaves you inside whatever level was already open, and everything spawned next lands there too, unless you check first.",
  "Forage can log into Epic without a person at the keyboard if the browser is already signed in: grab the redirect auth code and use it within about a minute, before it expires.",
];

function Tag({ outcome }: { outcome: Shot["outcome"] }) {
  const styles: Record<Shot["outcome"], string> = {
    win: "border-teal/40 text-teal",
    miss: "border-grape/40 text-grape",
    fix: "border-amber/40 text-amber",
  };
  const labels: Record<Shot["outcome"], string> = {
    win: "win",
    miss: "miss",
    fix: "fix",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${styles[outcome]}`}>
      {labels[outcome]}
    </span>
  );
}

function ShotFigure({ shot }: { shot: Shot }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line">
      <Image
        src={`/lab/fabel-showcase/${shot.file}`}
        alt={shot.alt}
        width={1600}
        height={900}
        unoptimized
        className="w-full"
      />
      <figcaption className="flex flex-col gap-2 p-4 text-xs leading-relaxed text-mist">
        <Tag outcome={shot.outcome} />
        <span>{shot.caption}</span>
      </figcaption>
    </figure>
  );
}

export default function FabelShowcaseDevlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32">
      <Ethereal variant="nebula" />
      <Reveal>
        <Link href="/lab/fabel-showcase" className="font-mono text-sm text-mist hover:text-teal">
          ← Fable Showcase
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-amber">Devlog</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          What Claude Fable 5.1 built with a night and an empty project
        </h1>
        <p className="mt-5 max-w-2xl text-xl leading-relaxed text-mist">
          I handed it a fresh UE 5.8 Third Person template, ECABridge&apos;s roughly 780 editor
          commands, and Forage pointed at my own Fab library. The idea — a museum hub whose portals
          are showcase levels for a category of the tool surface — was mine. Everything after that,
          it built, tested, and photographed on its own.
        </p>
        <p className="mt-4 max-w-2xl leading-relaxed text-mist">
          Five of nine planned levels got built by morning. Three of those five are rough —
          presentable, not polished — and this devlog says so plainly, chapter by chapter, in the
          order it actually happened: the wins next to the misses next to the fixes.
        </p>
      </Reveal>

      {chapters.map((chapter, ci) => (
        <Reveal key={chapter.title} delay={Math.min(ci * 40, 200)}>
          <section className="mt-16">
            <p className="font-mono text-xs uppercase tracking-widest text-teal">{chapter.number}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{chapter.title}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-mist">{chapter.intro}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {chapter.shots.map((shot) => (
                <ShotFigure key={shot.file} shot={shot} />
              ))}
            </div>
          </section>
        </Reveal>
      ))}

      <Reveal>
        <section className="mt-16">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">07</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">The flythrough</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-mist">
            A 12-second Movie Render Queue flythrough of the finished hub, closing out the night.
            The first render flew through the pyramid centerpiece; the second flew through the
            portals themselves. This is the third — Video QA&apos;d before it shipped.
          </p>
          <div className="mt-6 overflow-hidden rounded-3xl border border-line">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              controls
              playsInline
              poster="/lab/fabel-showcase/hub-flythrough-poster.webp"
              className="w-full"
            >
              <source src="/lab/fabel-showcase/hub-flythrough.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {flythroughStills.map((shot) => (
              <ShotFigure key={shot.file} shot={shot} />
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-16">
          <p className="font-mono text-xs uppercase tracking-widest text-mist">What I learned</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            The gotchas any new hire would hit — just faster, and overnight
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {lessons.map((lesson) => (
              <li key={lesson} className="flex gap-3 text-sm leading-relaxed text-mist">
                <span className="mt-0.5 text-amber">✦</span>
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal>
        <section className="glass mt-16 rounded-3xl p-8 md:p-10">
          <p className="font-mono text-xs uppercase tracking-widest text-teal">What&apos;s next</p>
          <h2 className="mt-3 text-xl font-bold">Four wings, still empty rooms with a return portal</h2>
          <p className="mt-4 leading-relaxed text-mist">
            Cinematics, gameplay, lighting, and characters are placeholders — bare rooms with
            nothing built in yet. The UMG splash screen, main menu, and popups that were supposed
            to wrap the whole hub are still owed too. Everything that shipped this round —
            environment, materials, audio — is due a polish pass before any of it is done-done.
            The flythrough sequence is already set up for a re-render once the rest catches up.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <div className="mt-14">
          <Link
            href="/lab/fabel-showcase"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-teal/60"
          >
            ← Back to Fable Showcase
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
