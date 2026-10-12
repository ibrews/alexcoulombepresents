import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Ethereal from "@/components/Ethereal";
import Reveal from "@/components/Reveal";
import { surrealMindsBackendRows, surrealMindsImages } from "@/lib/surrealMindsDiary";

export const metadata: Metadata = {
  title: "Surreal Minds — development diary",
  description:
    "An honest in-progress record of four small Unreal Engine worlds, their AI backends, and what editor, emulator, and headset tests actually showed.",
  alternates: { canonical: "/lab/surreal-minds/devlog" },
  openGraph: {
    images: [
      {
        url: "/lab/surreal-minds/memory-editor-photo-world.webp",
        alt: "Memory Portal's sunset photo-world in an Unreal desktop preview",
      },
    ],
  },
};

const statusStyles = {
  measured: "border-teal/40 bg-teal/10 text-teal",
  partial: "border-amber/40 bg-amber/10 text-amber",
  "not-run": "border-line bg-ink/40 text-mist",
};

export default function SurrealMindsDevlogPage() {
  return (
    <main className="relative overflow-hidden pb-28 pt-32">
      <Ethereal variant="nebula" />

      <div className="relative mx-auto max-w-6xl px-5">
        <Reveal>
          <Link href="/lab/surreal-minds" className="font-mono text-sm text-mist hover:text-teal">
            ← Surreal Minds
          </Link>
          <div className="mt-10 grid gap-10 border-b border-line pb-14 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal">
                Alex Coulombe Presents / development diary
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-[0.95] tracking-[-0.045em] md:text-7xl">
                The prototype looked back.
              </h1>
              <p className="mt-7 max-w-3xl text-xl leading-relaxed text-mist">
                Four small Unreal worlds are learning to react: to a photo, a wish, a gesture, or a
                key. This is the working record—not a release note—and the rough evidence stays next
                to the wins.
              </p>
            </div>
            <aside className="rounded-3xl border border-amber/35 bg-amber/5 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber">October 12, 2026</p>
              <p className="mt-3 text-2xl font-bold">In progress</p>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                Quest 3 testing is real. Swan performance is not measured. The three backend routes
                now have honest timing evidence, while matched native video and the revised Memory
                Portal headset direction still need their acceptance passes.
              </p>
            </aside>
          </div>
        </Reveal>

        <Reveal>
          <section className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="entry-one">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Entry 01 / the evidence loop</p>
              <h2 id="entry-one" className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                A photo became a place. Then the headset changed the brief.
              </h2>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-mist">
              <p>
                Memory Portal began with a deliberately small question: can a headset read a photo and
                let its colors, light and mood reshape a spatial scene? The first on-device Quest run
                timed out after 75 seconds. Changing the inference thread pools turned the next run into
                a correct caption in 20.0 seconds. That was a real improvement, but still too long to
                disappear inside an interaction.
              </p>
              <p>
                The next build paired on-headset captioning with a depth model on a studio PC. Unreal
                projected the photo onto a depth mesh, and moving your head produced parallax. It worked
                technically. Alex&apos;s wearer verdict was more useful: it felt like a familiar photo-depth
                effect, not the playful world already established by the rest of the experience.
              </p>
              <blockquote className="border-l-2 border-teal pl-6 text-xl font-semibold leading-relaxed text-white">
                “This should be a charming interpretation, not a simple tech demo of photo to 3D
                conversion.”
              </blockquote>
              <p>
                So the headline is changing again. The next Memory Portal should assemble a toy-like
                diorama from simple Unreal geometry—palms, boats, clouds, flowers, mountains, people—using
                the photo for placement, scale and color without copying it literally.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-20" aria-labelledby="surface-evidence">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">No blended evidence</p>
                <h2 id="surface-evidence" className="mt-2 text-3xl font-bold tracking-tight">
                  Editor, emulator, headset
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-mist">
                Each capture keeps the surface it came from. A desktop preview can prove composition;
                an emulator can prove an Android path; neither can stand in for a wearer verdict.
              </p>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {surrealMindsImages.slice(0, 3).map((image, index) => (
                <figure
                  key={image.src}
                  className={`overflow-hidden rounded-3xl border border-line bg-ink/60 ${index === 0 ? "md:col-span-2" : ""}`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={1600}
                    height={900}
                    priority={index === 0}
                    className="h-auto w-full"
                  />
                  <figcaption className="p-5">
                    <span className="rounded-full border border-teal/35 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-teal">
                      {image.surface}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-mist">{image.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-20 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]" aria-labelledby="headset-take">
            <div className="overflow-hidden rounded-3xl border border-line bg-black">
              {/* Source screen recording contains no spoken dialogue or other audio. */}
              <video
                controls
                playsInline
                preload="metadata"
                poster="/lab/surreal-minds/memory-quest-v14a-poster.webp"
                className="h-full w-full object-contain"
              >
                <source src="/lab/surreal-minds/memory-quest-v14a-headset.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="self-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Quest 3 / native screen recording</p>
              <h2 id="headset-take" className="mt-4 text-3xl font-bold tracking-tight">The test that changed the direction</h2>
              <p className="mt-5 leading-relaxed text-mist">
                This 28-second excerpt comes from the 127.7-second v14a headset recording. It shows
                the two-eye device output as the on-device caption finishes and the studio-PC depth
                result appears. It is not cropped into a marketing view, and it predates the v14b
                text pass.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-mist">
                What it proves: the end-to-end headset path ran. What it does not prove: that the
                result was good. The wearer verdict rejected this literal depth-mesh direction.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-20" aria-labelledby="backend-comparison">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">Measured, capture pass pending</p>
            <h2 id="backend-comparison" className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Three ways to run the AI, one honest scorecard
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-mist">
              The same authored fixtures now have results through on-device, LAN and cloud routes.
              The numbers are real; a single matched headset-video pass across all three is still pending.
            </p>
            <div className="mt-8 overflow-hidden rounded-3xl border border-line">
              {surrealMindsBackendRows.map((row) => (
                <div key={row.route} className="grid gap-4 border-b border-line p-6 last:border-0 md:grid-cols-[180px_1fr_1.25fr] md:p-8">
                  <div>
                    <p className="font-bold">{row.route}</p>
                    <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${statusStyles[row.status]}`}>
                      {row.status.replace("-", " ")}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white">{row.measured}</p>
                  <p className="text-sm leading-relaxed text-mist">{row.result}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-20" aria-labelledby="beauty-pass">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal">Unreal stays visible</p>
                <h2 id="beauty-pass" className="mt-4 text-4xl font-bold tracking-tight">The worlds need stagecraft, not just inference.</h2>
              </div>
              <p className="text-lg leading-relaxed text-mist">
                Living Tabletop and Creature Home are getting stronger lighting, fog, light shafts,
                animated response cues and readable in-world controls. The images below are ES3.1
                mobile-preview editor frames. They are useful look-development evidence, not device
                performance evidence; GPU cost on the Swan is still unmeasured.
              </p>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              {surrealMindsImages.slice(3).map((image) => (
                <figure key={image.src} className="overflow-hidden rounded-3xl border border-line bg-ink/60">
                  <Image src={image.src} alt={image.alt} width={1600} height={900} className="h-auto w-full" />
                  <figcaption className="p-5">
                    <span className="rounded-full border border-amber/35 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-amber">
                      {image.surface}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-mist">{image.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-20 grid gap-8 rounded-3xl border border-line bg-ink/70 p-6 md:p-10 lg:grid-cols-[1.2fr_0.8fr]" aria-labelledby="review-cut">
            <div className="overflow-hidden rounded-2xl border border-line bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                controls
                playsInline
                preload="metadata"
                poster="/lab/surreal-minds/interaction-showcase-review-poster.webp"
                className="w-full"
              >
                <source src="/lab/surreal-minds/interaction-showcase-review-cut.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="self-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">October 9 / review cut</p>
              <h2 id="review-cut" className="mt-4 text-3xl font-bold tracking-tight">The earlier interaction reel</h2>
              <p className="mt-5 leading-relaxed text-mist">
                This 47-second internal review cut mixes honestly labeled desktop, emulator and
                native test footage from earlier builds. It is included as process evidence, not as
                a current trailer or proof that the latest headset builds are accepted.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="mt-20 border-t border-line pt-12" aria-labelledby="next-entry">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-mist">For the next entry</p>
            <h2 id="next-entry" className="mt-3 text-3xl font-bold tracking-tight">What still has to become true</h2>
            <ul className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                "Capture the three measured backend routes side by side in one matched native-video pass.",
                "Replace Memory Portal's literal depth sheet with a charming primitive-built diorama and test it again in the headset.",
                "Make every AI result land with readable text, a chime and an unmistakable visual change.",
                "Measure frame time and GPU cost on a real target headset; editor and emulator numbers do not answer that question.",
              ].map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-line p-5 text-sm leading-relaxed text-mist">
                  <span className="text-teal" aria-hidden="true">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
