import type { Metadata } from "next";
import Image from "next/image";
import HarborfolkBenchmark from "@/components/HarborfolkBenchmark";
import Link from "next/link";
import { harborfolkDiary, harborfolkUrl } from "@/lib/harborfolkDiary";

export const metadata: Metadata = {
  title: "Harborfolk — development diary",
  description: "Building a browser strategy game with believable scale, visible crews, and a village you can watch at work.",
  alternates: { canonical: "/lab/harborfolk/devlog" },
  openGraph: { images: [{ url: "/lab/harborfolk/village.webp", alt: "Harborfolk's first playable village" }] },
};

export default function HarborfolkDiary() {
  return <main className="mx-auto max-w-6xl px-5 pb-24 pt-32">
    <Link href="/lab/harborfolk" className="font-mono text-sm text-teal hover:underline">← Harborfolk</Link>
    <div className="mb-16 mt-8 grid gap-8 border-b border-line pb-12 md:grid-cols-[1fr_260px]">
      <div><p className="font-mono text-xs uppercase tracking-[.22em] text-teal">Development diary · browser RTS</p><h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">People make<br />the harbor.</h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">A small strategy game for my kid, built around believable scale and people you can see doing the work. Notes from the playable builds, with the experiments and rough edges kept in view.</p></div>
      <aside className="self-end rounded-2xl border border-line p-6"><p className="font-mono text-xs text-teal">PLAY THE CURRENT BUILD</p><a href={harborfolkUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block text-xl font-bold hover:text-teal">Open Harborfolk ↗</a><p className="mt-3 text-sm leading-relaxed text-mist">Best on a computer. Click to select, right-click to give orders, middle-drag to orbit, and scroll to zoom.</p><p className="mt-4 text-xs leading-relaxed text-mist">Current build: city building, three ages, research, shared harbor plans, crewed fleets and boarding, a thirty-type battle scenario and mass-army laboratory, and direct two-person co-op. Harbor WebXR is available where supported; battle scenarios use desktop controls. Physical headset testing is pending.</p></aside>
    </div>
    <nav aria-label="Diary entries" className="mb-12 flex flex-wrap gap-3">{harborfolkDiary.map(entry=><a key={entry.id} href={`#${entry.id}`} className="rounded-full border border-line px-4 py-2 text-sm text-mist hover:border-teal hover:text-teal">{entry.title} ↓</a>)}</nav>
    <div className="space-y-24">{harborfolkDiary.map(entry=><article key={entry.id} id={entry.id} className="scroll-mt-28 border-t border-line pt-8">
      <div className="grid gap-8 md:grid-cols-[190px_1fr]"><div><time className="block font-mono text-xs text-mist">{entry.date}</time><p className="mt-3 font-mono text-xs text-teal">{entry.version}</p><a href={`#${entry.id}`} aria-label={`Link to ${entry.title}`} className="mt-3 block text-xs text-mist hover:text-teal">Permalink ↗</a></div><div><h2 className="text-3xl font-bold tracking-tight md:text-4xl">{entry.title}</h2><div className="mt-6 max-w-2xl space-y-5 text-base leading-relaxed text-mist">{entry.paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div>{entry.sources?.length?<nav aria-label={`Sources for ${entry.title}`} className="mt-6 flex max-w-2xl flex-wrap gap-x-5 gap-y-2 text-sm">{entry.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">{source.title} ↗</a>)}</nav>:null}</div></div>
      {entry.benchmark?<HarborfolkBenchmark data={entry.benchmark} />:null}
      <div className="mt-10 grid gap-7 md:grid-cols-2">{entry.images.map((image,index)=><figure key={image.src} className={index===entry.images.length-1&&entry.images.length%2?"md:col-span-2":""}><div className="overflow-hidden rounded-xl border border-line"><Image src={image.src} alt={image.alt} width={1440} height={900} className="h-auto w-full" sizes="(max-width: 768px) 100vw, 50vw" /></div><figcaption className="mt-3 text-sm leading-relaxed text-mist">{image.caption}</figcaption></figure>)}</div>
    </article>)}</div>
  </main>;
}
