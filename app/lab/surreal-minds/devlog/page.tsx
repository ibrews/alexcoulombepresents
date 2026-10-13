import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import { surrealMindsBackendRows, surrealMindsImages } from "@/lib/surrealMindsDiary";

export const metadata: Metadata = {
  title: "Surreal Minds: from a photo to a little world | Development diary",
  description: "Real AI demos, a visual on-device / LAN / cloud comparison, and the tools that let us test four Unreal worlds before putting on a headset. Alex Coulombe Presents.",
  alternates: { canonical: "/lab/surreal-minds/devlog" },
  openGraph: { images: [{ url: "/lab/surreal-minds/memory-v15-toy-snow.webp", alt: "A photo of snowy pines interpreted as a toy cabin, trees and moon in Unreal Engine" }] },
};

const media = "/lab/surreal-minds/";
const body = "space-y-5 text-lg leading-relaxed text-mist";
const eyebrow = "font-mono text-xs uppercase tracking-[0.18em] text-teal";

function Still({ src, alt, caption, priority = false }: { src: string; alt: string; caption: string; priority?: boolean }) {
  return <figure className="overflow-hidden rounded-2xl border border-line bg-ink/70">
    <Image src={media + src} alt={alt} width={1600} height={900} priority={priority} sizes="(max-width: 768px) 100vw, 1152px" className="h-auto w-full" />
    <figcaption className="p-5 text-sm leading-relaxed text-mist">{caption}</figcaption>
  </figure>;
}

function Clip({ file, title, label, children }: { file: string; title: string; label: string; children: React.ReactNode }) {
  return <figure className="overflow-hidden rounded-2xl border border-line bg-ink/70">
    <div className="border-b border-line px-5 py-4"><p className={eyebrow}>{label}</p><h3 className="mt-2 text-xl font-bold">{title}</h3></div>
    <video controls playsInline preload="none" poster={media + file + "-poster.webp"} aria-label={title} className="mx-auto max-h-[620px] w-full bg-black object-contain">
      <source src={media + file + ".mp4"} type="video/mp4" />
      <a href={media + file + ".mp4"}>Download the video</a>
    </video>
    <figcaption className="p-5 text-sm leading-relaxed text-mist">{children}</figcaption>
  </figure>;
}

const paired = [
  { name: "On-device", detail: "Quest 3 CLI · SmolVLM-500M", image: "seaside-input.webp", alt: "The identical synthetic seaside sunset supplied to the on-device caption model", seconds: "9.095 s CLI wall time", caption: "“This image is a digital art piece.”", colors: ["#754661", "#BFA27C", "#FA8F44"], result: "A generic caption. Deterministic pixel rules completed the scene: water, dusk, Lantern Tide. Swatches are the resulting scene palette, not model-predicted object colors." },
  { name: "LAN PC", detail: "Host request · Gemma 3 4B on Archie", image: "seaside-input.webp", alt: "The same synthetic seaside sunset supplied to the LAN model", seconds: "7.408 s client total", caption: "“Sunset on a tropical beach”", colors: ["#FF9966", "#FFCC99", "#800000"], result: "The model returned a structured Lantern Tide / dusk scene, a title, palette and motion. 6.875 s was model inference; this recheck ran while the PCs served other work." },
  { name: "Cloud", detail: "Host result visualization · Gemini Flash", image: "seaside-cloud-boxes.webp", alt: "The same sunset with recorded cloud detections around palms, the sun, water and birds", seconds: "11.890 s bridge total", caption: "“Sunset over the beach with stylized palms”", colors: ["#522D68", "#473E55", "#FFDC72"], result: "The reply added object kinds, boxes, scale and approximate relative depth. The boxes above visualize actual detections. These support toy assembly; they are not segmentation or metric depth." },
];

export default function SurrealMindsDevlogPage() {
  return <main className="relative overflow-hidden pb-28 pt-[calc(var(--banner-h,0px)+6rem)]">
    <Ethereal variant="nebula" />
    <article className="relative mx-auto max-w-6xl px-5">
      <Link href="/lab/surreal-minds" className="font-mono text-sm text-mist hover:text-teal">← Surreal Minds</Link>
      <header className="mt-10 border-b border-line pb-12">
        <p className={eyebrow}>Alex Coulombe Presents / field notes / 2026-10-07 to 2026-10-13</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-[1.02] tracking-[-0.045em] md:text-7xl">From a photo<br /> to a little world.</h1>
        <p className="mt-7 max-w-3xl text-xl leading-relaxed text-mist">A garden that answers a wish. A memory rebuilt as toys. Four Unreal prototypes, a fleet of AI collaborators, and the difference between a successful log line and something you can actually feel.</p>
        <nav aria-label="Diary chapters" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-teal">
          <a href="#story">The story ↓</a><a href="#ai-demo">Watch the AI ↓</a><a href="#backends">Compare backends ↓</a><a href="#without-headset">Tested without a headset ↓</a><a href="#lessons">Lessons ↓</a>
        </nav>
      </header>
      <div className="mt-10"><Still src="memory-v15-toy-snow.webp" priority alt="Snowy pines and a cabin from a sample photo become simple toy geometry beneath a moon and golden arch" caption="Unreal desktop native render · Memory Portal v15 · cloud vision via a studio PC. The sample photo becomes pines, a cabin and a moon built from our primitive kit. Captured before the October 13 Quest wearer test: Alex confirmed it worked, then asked for fewer hallucinations and a clearer stage." /></div>

      <section id="story" className="scroll-mt-[calc(var(--banner-h,0px)+5rem)] mt-16 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div><p className={eyebrow}>01 / The brief meets the prototype</p><h2 className="mt-4 text-4xl font-bold tracking-tight">“We don&apos;t even see any interactivity.”</h2><p className="mt-4 text-sm text-mist">Alex, reviewing the first teasers, 2026-10-07</p></div>
        <div className={body}>
          <p>The Surreal Minds work for the SensAI brief explored small spatial experiences for PICO: import a memory, tend an impossible garden, grow a tabletop world, or care for a little creature. The brief asked us to distinguish AI used to build an app from AI that responds inside the app.</p>
          <p>That distinction mattered. Memory Portal began with authored destinations. Living Tabletop and Creature Home had deterministic play and care rules. Attractive footage did not establish photo understanding, a conversational pet, or generated game rules.</p>
          <blockquote className="border-l-2 border-amber pl-5 text-xl text-white">“none of the teasers show enough of the actual experience. We don&apos;t even see any interactivity”</blockquote>
          <p>All three first teasers were rejected. The next useful artifact was a real action-and-result recording. In the PICO emulator, scripted controller input made Miso react, grew plants, and advanced a recipe. It also exposed a Tabletop trigger that never registered. Finding that before a wearer test was progress too.</p>
        </div>
      </section>
      <div className="mt-9"><Clip file="creature-emulator-interaction" title="The first recorded interaction loop" label="PICO emulator window · scripted input · no runtime AI">48-second Windows Graphics Capture take from 2026-10-07, with the emulator title bar preserved. Care, room changes and kitchen steps run through the app&apos;s authored rules. Silent web copy; the on-screen captions identify the test. This is emulator input, not physical hand tracking.</Clip></div>

      <section id="ai-demo" className="scroll-mt-[calc(var(--banner-h,0px)+5rem)] mt-20">
        <p className={eyebrow}>02 / Input → AI → visible result</p><h2 className="mt-4 text-4xl font-bold tracking-tight">Give the garden a sentence.</h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className={body}><p>On 2026-10-08, Memory Portal could read an actual image file through a studio-PC vision service. Three synthetic fixtures became different destinations, palettes, light and captions. Cancel, undo and reset preserved control over the result.</p><p>Conservatory gained a typed-wish path: a companion page sends a sentence, Gemma 3 4B returns a constrained recipe, and Unreal validates it again before changing the garden. “Add a dragon” is refused. The model can choose supported care actions; it cannot invent arbitrary executable behavior.</p></div>
          <div className="rounded-2xl border border-teal/30 bg-teal/5 p-6"><p className={eyebrow}>Follow the purple wish</p><ol className="mt-5 space-y-4 text-lg"><li>1. Input: “paint the leaves purple”</li><li>2. LAN AI: a validated <code className="text-teal">#7A3FA0</code> tint recipe, 783 ms in this take</li><li>3. Result: the emulator&apos;s native leaf render changes color</li></ol><p className="mt-5 text-sm leading-relaxed text-mist">The video also shows rain, a dragon refusal, sun and bloom, and an autumn-color request. It preserves the original prototype staging so the change is easy to inspect.</p></div>
        </div>
        <div className="mx-auto mt-9 max-w-3xl"><Clip file="conservatory-ai-wishes" title="Five wishes through the real model and garden" label="PICO emulator native renders · LAN Gemma 3 4B">16-second sampled sequence from about 46 seconds of testing. Native Unreal screenshots were taken about every three seconds, then assembled with the recorded wish and reply. This is time-compressed evidence, not continuous motion or a latency demonstration. Silent; input, model and result are written on screen.</Clip></div>
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2">
        <div><p className={eyebrow}>03 / The headset changes the brief</p><h2 className="mt-4 text-4xl font-bold tracking-tight">The wait became part of the world.</h2><div className={body + " mt-6"}>
          <p>By the next Quest session, both photo captioning and voice wishes could run on the headset. The first Memory in-app read failed at 75 seconds, despite a roughly nine-second standalone command-line test. Sharing CPU time with Unreal changed the problem.</p>
          <blockquote className="border-l-2 border-teal pl-5 text-white">“we should have SOMETHING that happens while you wait. also there&apos;s blocks in the middle of my hands”</blockquote>
          <p>V13 changed inference thread pools and stopped busy polling. A later Quest read completed correctly in 20.0 seconds; another v14b run took 26.4. Real progress stages and moving motes made the wait legible. Controller stand-in bars were hidden when a hand was tracked.</p>
          <p>Voice exposed another gap: the Quest heard “Make all the leaves pink,” produced the correct recipe, and logged its application. Alex could not tell that it had listened, and saw no leaf change. V10 now has larger listening, transcript and done states and a stronger color response, verified on desktop. Headset acceptance is still open.</p>
        </div></div>
        <Clip file="memory-quest-v14a-single-eye" title="The photo-depth experiment Alex redirected" label="Quest 3 headset · on-device caption + LAN PC depth">13-second continuous reveal excerpt from the 127.7-second v14a headset recording, cropped to the left eye for web viewing. SmolVLM captioning ran on Quest; Depth Anything V2 ran on Fort. Black frames and the later app-exit view are excluded. This is historical process evidence, not a full inference timer. Silent original; it predates the toy-diorama direction and the v14b text pass.</Clip>
      </section>

      <section className="mt-20">
        <p className={eyebrow}>04 / A charming interpretation</p><h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight">Keep the memory. Change the material.</h2>
        <blockquote className="mt-7 max-w-4xl border-l-2 border-amber pl-6 text-2xl leading-relaxed">“This should be a charming interpretation, not a simple tech demo of photo to 3D conversion.”</blockquote><p className="mt-3 text-sm text-mist">Alex, after wearing the v14 photo-depth build, 2026-10-12</p>
        <div className={body + " mt-7 max-w-4xl"}><p>V15 replaces the photo surface with a kit of 15 primitive kinds. Cloud vision returns object boxes, relative depth, scale and color; Unreal builds palms, cabins, pines, clouds and boats with staggered bounce, twist and assembly cues. The geometry is authored and bounded. The model interprets the composition.</p><p>Six real photo requests, including a mirrored beach, passed the object contract. Mirroring moved the palms and sun to opposite sides, a useful check that layout came from the image. Two native desktop sequences exercised import, assembly, undo, a second photo, cancellation and reset. These desktop captures preceded the October 13 Quest wearer test. Alex confirmed that v15 worked, then requested less starter scenery and fewer hallucinated objects.</p></div>
        <div className="mt-8 grid gap-7 md:grid-cols-2"><Still src="memory-v15-toy-beach.webp" alt="A stylized palm and sun assembled from primitives on an oval beach stage" caption="Desktop native render · cloud vision via PC · v15 beach. Boxes guide placement; toy geometry supplies the style." /><Still src="memory-v15-toy-garden.webp" alt="The cloud-interpreted garden fixture rebuilt as small trees, flowers and clouds on a stage" caption="Desktop native render · cloud vision via PC · v15 garden. Eleven objects, 85 pieces, 3.27 seconds of assembly after the model reply. Assembly time is not inference time." /></div>
      </section>

      <section id="backends" className="scroll-mt-[calc(var(--banner-h,0px)+5rem)] mt-20">
        <p className={eyebrow}>05 / Same image, three routes</p><h2 className="mt-4 text-4xl font-bold tracking-tight">Where should the thinking happen?</h2>
        <div id="memory-v16" className="mt-8 rounded-2xl border border-teal/30 bg-teal/5 p-6 md:p-8">
          <p className={eyebrow}>2026-10-13 / Memory Portal v16</p>
          <h3 className="mt-3 text-3xl font-bold">One photo. Switch the model. Keep the comparison.</h3>
          <blockquote className="mt-6 border-l-2 border-amber pl-5 text-xl">&ldquo;ok it&apos;s working. it&apos;s pretty good... but there&apos;s some weird hallucinations or it&apos;s not removing enough of the starter content. also can&apos;t I test cloud or local AI too ?&rdquo;</blockquote>
          <p className="mt-3 text-sm text-mist">Alex, wearing v15 on Quest 3</p>
          <div className={body + " mt-6"}>
            <p>V16 clears the authored starter props when the toy stage appears; undo brings them back. It limits the scene to eight objects and requires caption support, independent detector evidence and overlap checks. A convincing sentence is no longer enough to place an object.</p>
            <p>The controls now switch between cloud, studio PC and local captioning. Compare rebuilds the photo already in the frame through the next route. Each result keeps its backend and measured caption, grounding and assembly stages visible.</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3 text-sm leading-relaxed text-mist">
            <p><strong className="text-white">Cloud.</strong> Gemini proposes the composition through a PC bridge. Independent detectors validate its boxes before Unreal builds the toys.</p>
            <p><strong className="text-white">LAN PC.</strong> Gemma 3 4B describes the photo on an RTX 4090 PC. OWLv2 and a selective Grounding DINO fallback find objects on an RTX 5090 PC. The photo stays on the studio network.</p>
            <p><strong className="text-white">On-device path.</strong> SmolVLM supplies a caption. Simple rules place primitives, explicitly labeled &ldquo;caption-only / approximate.&rdquo; Desktop footage of this code path does not establish headset latency.</p>
          </div>
          <div className="mt-8"><Clip file="memory-v16-backend-comparison" title="The same beach through three app backends" label="Unreal desktop native samples / v16 / identical photo">Three sequential runs from one app session, aligned side by side at photo-read time. Native viewport samples at up to 5 Hz, edited for comparison and held after each result. Silent. The clip labels its playback treatment; it is not continuous headset footage, a hand-tracking test or a frame-rate benchmark.</Clip></div>
          <p className="mt-6 text-sm leading-relaxed text-mist">This take includes a cold detector start: cloud took 73.4 seconds through assembly, of which 57.6 seconds loaded local detector libraries/models and 11.0 seconds ran the cloud vision request. LAN then used warm detectors and took 12.2 seconds. The local caption path took 6.7 seconds on the desktop. These are measured stages in this run, not a fair warm-start race or Quest timing claims.</p>
          <p className="mt-5 text-sm leading-relaxed text-mist">The conservative filter has a cost: it can omit real detail. In the five-fixture evaluation, cloud garden flowers failed independent box matching; the LAN garden kept larger detected flower groups. An autumn caption incorrectly named a moon, but the detector check prevented a moon from appearing. These are synthetic test images, not a general accuracy benchmark.</p>
        </div>
        <h3 className="mt-12 text-2xl font-bold">Earlier backend study, October 9–12</h3>
        <p className="mt-6 max-w-4xl text-lg leading-relaxed text-mist">Below, the same project-generated seaside image goes through each backend. These are visualizations of recorded outputs, with the resulting sky, water and accent palettes underneath. They compare what each route returned. They are not a matched three-backend app-render or headset-video test.</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">{paired.map((p) => <figure key={p.name} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-ink/70">
          <div className="p-5"><h3 className="text-2xl font-bold">{p.name}</h3><p className="mt-2 text-xs leading-relaxed text-teal">{p.detail}</p></div>
          <Image src={media + p.image} alt={p.alt} width={768} height={576} sizes="(max-width: 1024px) 90vw, 360px" className="aspect-[4/3] w-full object-contain bg-black" />
          <figcaption className="p-5"><p className="font-mono text-sm text-amber">{p.seconds}</p><p className="mt-4 font-semibold">{p.caption}</p><div className="mt-4 flex h-7 overflow-hidden rounded" aria-label={"Scene palette: " + p.colors.join(", ")}>{p.colors.map(c => <span key={c} className="flex-1" style={{ backgroundColor: c }} title={c} />)}</div><p className="mt-4 text-sm leading-relaxed text-mist">{p.result}</p></figcaption>
        </figure>)}</div>
        <p className="mt-5 text-sm leading-relaxed text-mist">Timing scopes differ: the on-device card is the October 9 Quest CLI benchmark, not the later app. LAN is a client total; cloud is a bridge total. The CLI&apos;s raw caption trailed off; its displayed sentence and palette are the validated downstream result. The cloud study recorded the resolved model as Gemini 3.8 Flash, behind a rolling alias.</p>
        <h3 className="mt-12 text-2xl font-bold">Earlier measured interaction costs</h3>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line"><table className="w-full min-w-[660px] text-left text-sm leading-relaxed"><caption className="sr-only">Measured on-device, LAN PC and cloud latency, models and connectivity limits</caption><thead className="bg-white/5"><tr><th scope="col" className="p-5">Backend</th><th scope="col" className="p-5">Observed latency</th><th scope="col" className="p-5">What it means</th></tr></thead><tbody>{surrealMindsBackendRows.map(row => <tr key={row.route} className="border-t border-line align-top"><th scope="row" className="p-5 text-teal">{row.route}</th><td className="p-5">{row.measured}</td><td className="p-5 text-mist">{row.result}</td></tr>)}</tbody></table></div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm leading-relaxed text-mist"><p>The LAN warm-voice measurement is a synthetic “rain and flowers” clip: 0.224 s speech recognition + 0.842 s model. It is a different input from the on-device pink/blue wishes and the typed cloud purple request. Recording time is additional. These are observed runs, not service guarantees.</p><p>On-device keeps the model and photo local. LAN needs the studio machines; cloud sends the image through the bridge to the provider and requires internet. LAN and local have no per-call provider fee; cloud is metered. Electricity and hardware cost were not measured. No provider key is shipped in the app.</p></div>
        <p className="mt-7 max-w-4xl text-lg leading-relaxed">For the next demo, LAN is the practical choice for responsive wishes and captions. Cloud earned a place by returning richer object layouts. On-device remains meaningful for privacy and offline operation, with a much more visible wait. The fast LAN depth model does not by itself make a charming scene.</p>
      </section>

      <section id="without-headset" className="scroll-mt-[calc(var(--banner-h,0px)+5rem)] mt-20">
        <p className={eyebrow}>06 / Tested without a headset</p><h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight">Save the wearer for the questions only a wearer can answer.</h2>
        <p className="mt-6 max-w-4xl text-lg leading-relaxed text-mist">Claude and Codex worked across parallel app, inference, capture and review lanes. Shared evidence and the fleet bus connected those lanes; named source branches and a host build lease kept them from competing for the same build. The useful measure is what they verified before asking Alex to put a headset on.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">{[
          ["3 / 3 photos", "LAN scene contracts passed for beach, snowy pines and garden. Native emulator sequences exercised photo import, cancel, undo and reset."],
          ["5 wishes", "The emulator garden handled rain, purple leaves, a dragon refusal, sun/bloom and autumn tint. Unsupported actions preserved the garden."],
          ["8 gesture routes", "Conservatory desktop tests dispatched all eight gestures into care actions. This verified the mapping, not real hand recognition."],
        ].map(([n, text]) => <div key={n} className="rounded-2xl border border-teal/25 bg-teal/5 p-6"><p className="text-3xl font-bold text-teal">{n}</p><p className="mt-4 text-sm leading-relaxed text-mist">{text}</p></div>)}</div>
        <div className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">
          {[
            ["Forage: find what we already own", "Our asset scout searches the owned library by intent. The diary workflow checks it before acquiring new props. This iteration ultimately used a consistent procedural toy kit; we are not claiming these palms came from a Forage import.", "/lab/forage"],
            ["UOXR + xrsim: exercise the shared foundation", "Memory Portal derives from the Ultimate OpenXR Template; the other apps reuse its hand bridge on the vr58 baseline. In separate upstream xrsim QA, a native menu-click fixture passed 18 checks and tracking visuals passed 12. That protects shared input behavior, but is not four-app physical acceptance.", "/lab/ultimate-openxr-template"],
            ["PICO emulator + Windows Graphics Capture", "Install the real Android package, drive an app action, record the emulator window. Foreground-checked SendInput reached Creature's controller actions. Native Unreal Shot captures supplied app pixels when the emulator compositor put a black panel over Memory.", ""],
            ["adb, logcat and native Shots", "Package, signature, cooked-content, startup, focus and result checks caught failures before a wearer. Logcat and pulled Unreal logs locate the event; native Shots verify its pixels. Not every app sends its own log to logcat, and application pixels do not prove final compositor output.", ""],
            ["Fleet bus: explicit handoffs", "Claude and Codex shared concrete artifact paths, test results and ownership. A queued message did not count as accepted work. Parallel development helped cover apps and tooling while shared host builds remained serialized.", ""],
            ["Video QA Workbench: inspect the evidence", "The first six teaser exports were decoded and analyzed across all 5,400 frames. Freeze, motion and sharpness advisories gave review points; no black spans were detected. Alex still rejected their missing interactivity. Automated video checks support creative judgment; they do not supply it.", ""],
          ].map(([title, text, href]) => <div key={title} className="border-t border-line pt-5"><h3 className="text-xl font-bold">{href ? <Link className="hover:text-teal" href={href}>{title} ↗</Link> : title}</h3><p className="mt-3 text-sm leading-relaxed text-mist">{text}</p></div>)}
        </div>
        <aside className="mt-10 rounded-2xl border border-amber/35 bg-amber/5 p-7"><h3 className="text-2xl font-bold">What still needed the headset</h3><p className="mt-4 text-lg leading-relaxed text-mist">The invisible leaf tint. Blocks drawn through otherwise good hands. Whether a pinch feels natural, a label is comfortable to read, or the scene holds up when you turn your head. Stereo, real tracking, audio feedback and sustained GPU/thermal performance remain device questions. There is no measured total of headset-hours saved.</p></aside>
      </section>

      <section className="mt-20"><p className={eyebrow}>Progress in the other little worlds</p><h2 className="mt-4 text-4xl font-bold tracking-tight">Give every action a readable payoff.</h2><p className="mt-5 max-w-3xl text-lg leading-relaxed text-mist">Living Tabletop and Creature Home remain authored gameplay, with no runtime AI in these captures. Better framing, lighting, contact shadows, response animation and controls make the interaction easier to understand.</p><div className="mt-8 grid gap-7 md:grid-cols-2">{surrealMindsImages.slice(3).map(i => <Still key={i.src} src={i.src.replace(media, "")} alt={i.alt} caption={i.caption + " Runtime AI: none."} />)}</div></section>

      <section id="lessons" className="scroll-mt-[calc(var(--banner-h,0px)+5rem)] mt-20 border-t border-line pt-10">
        <p className={eyebrow}>07 / Lessons along the way</p><h2 className="mt-4 text-4xl font-bold tracking-tight">The failures that changed the next test.</h2>
        <div className="mt-8 grid gap-7 md:grid-cols-2">{[
          ["An input API can exist and still be unusable.", "PICO emulator 0.13 gRPC hand input and screenshot requests crashed the emulator. PostMessage keys had no effect. Foreground-checked SendInput was the working Creature route; later keyboard regressions made one-action smoke checks essential before another take."],
          ["An OpenXR instance is not an XR session.", "In the adjacent Joby360 diagnostic, a normal launch reached the runtime but created no swapchains. The -vr launch argument advanced it; bStartInVR was the Library-launch fix. The emulator predicted the startup failure before the physical test."],
          ["Frame synthesis can activate while capture goes blank.", "Related PICO emulator tests reported AppSW on while captures stayed flat. Switching frame synthesis off restored pixels. Memory's black panel persisted with synthesis off, so it was a different unresolved capture defect. Native Shots proved app rendering, not headset composition."],
          ["A CLI benchmark is not an app budget.", "The tiny vision model managed about nine seconds on Quest's command line, then failed at 75 seconds inside Unreal. Thread-pool changes brought an app run to 20 seconds. Measure while rendering and interacting; do not advertise the isolated benchmark as the experience."],
          ["Applied is not visible.", "Conservatory logged the correct tint, but Alex saw no leaf change. The repair must pass a same-pose native before/after and a wearer check. Likewise, a valid caption was not enough when Alex expected geometry that evoked the photo."],
          ["Pretty source assets are not enough.", "Memory and Creature instanced props fell back to the default material because an instancing usage flag was missing. Native captures exposed it. Cooked-content checks then caught a new Conservatory material absent from an otherwise successful package."],
        ].map(([title, text]) => <div key={title} className="rounded-2xl border border-line p-6"><h3 className="text-xl font-bold">{title}</h3><p className="mt-4 text-sm leading-relaxed text-mist">{text}</p></div>)}</div>
      </section>
      <footer className="mt-16 border-t border-line pt-8"><h2 className="text-2xl font-bold">What the next wearer test must answer.</h2><p className="mt-5 max-w-4xl text-lg leading-relaxed text-mist">V15 worked in the Quest wearer test. V16 now makes backend comparison visible and reduces unsupported objects; its new matched desktop footage is shown above. The remaining wearer questions are composition, gesture comfort, readable timing and sustained device performance. Conservatory&apos;s stronger wish feedback still needs its own headset verdict. These are experimental prototypes from Alex Coulombe Presents, not a product release or a claim of PICO endorsement.</p><p className="mt-5 text-sm leading-relaxed text-mist">Evidence window: 2026-10-07 through 2026-10-13. All displayed photo inputs are project-generated fixtures. Source receipts, native captures and logs distinguish desktop, emulator and headset results; no private photos or recordings of people are included.</p></footer>
    </article>
  </main>;
}
