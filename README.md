# alexcoulombepresents.com

The personal site of **Alex Coulombe** — Unreal Engine, Godot, Apple Vision Pro, AI agents, live
immersive theatre, and Manhattan's first Unreal Authorized Training Center. Replaces the old
Google Sites page with something interactive, dynamic, and worthy of the domain.

Built with **Next.js 15 + Tailwind CSS 4**, zero other runtime dependencies. Deploys to Vercel
with no configuration.

## Pages

| Route | What it is |
|---|---|
| `/` | Hero with an interactive particle constellation, rotating-role typewriter, featured repos with live GitHub star counts |
| `/about` | The architect → XR-chitect story, interactive career timeline, stats |
| `/training` | The Unreal Authorized Training Center: 11 course tracks (including the new AI for Unreal class), formats, booking |
| `/repos` | Curated open-source catalog by category — each repo gets its own beautifully formatted page linking to its living GitHub wiki |
| `/repos/[slug]` | Per-repo deep dive: story, highlights, clone command, live stars |
| `/skills` | AI skills for Claude Code — live on Capafy (ue5-testflight, ios-testflight), in the pipeline (godot-visionos, spatial-deck-maker, app-store-aso, metahuman-godot-pipeline), and free open source |
| `/videos` | Curated YouTube videos by theme + real channel playlists, with click-to-load embeds |
| `/lab` | Teaser for upcoming products (the private repos) |
| `/lab/forage` | Forage — AI-first asset scout for your owned Fab library |
| `/lab/unrealitykit-bridge` | UnRealityKit Bridge — UE simulation + RealityKit rendering |
| `/lab/pinchwork` | Pinchwork — universal OpenXR hand tracking template |
| `/lab/unreal-visionos` | The Unreal × visionOS engine-improvement punch list |
| `/links` | Agile Lens, socials, podcast — and alexcoulombe.com, lovingly preserved in 2013 amber |

## Quickstart

```bash
npm install
npm run dev
# → http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

## Deploy to Vercel

1. Import `ibrews/alexcoulombepresents` at [vercel.com/new](https://vercel.com/new) — framework
   auto-detects as Next.js, no settings needed.
2. Once happy, point the `alexcoulombepresents.com` domain at the Vercel project
   (Project → Settings → Domains).

## Things to Try

1. **Run it locally** — `npm install && npm run dev`, open http://localhost:3000, and wave your
   cursor through the hero: the particle constellation gets out of your way.
2. **Press `⌘K`** (or `Ctrl+K`) anywhere — a command palette jumps you to any page, repo, or
   product. Type "godot" and hit Enter.
3. **Enter the Konami code** (`↑ ↑ ↓ ↓ ← → ← → B A`) — the site briefly enters immersive mode,
   locked at 90 fps, naturally.
4. **Open a repo page** (e.g. `/repos/blueprint-auto-layout`) and watch the star count — it's
   fetched live from the GitHub API with a baked fallback, so it's always current.
5. **Visit `/links` and click "Visit anyway (brave)"** under the vintage alexcoulombe.com card.
   You were warned.
6. **Play a video on `/videos`** — embeds are click-to-load (zero YouTube JS until you press play),
   served via youtube-nocookie.

## Editing content

All copy lives in one file: [`lib/data.ts`](lib/data.ts) — repos, products, timeline, courses,
links. Add a repo or product there and its card *and* detail page appear automatically. No CMS,
no Markdown pipeline, just a typed array.

## Architecture notes

- **No animation library** — reveals are an `IntersectionObserver` + CSS, the hero is a hand-rolled
  `<canvas>` particle field (respects `prefers-reduced-motion`), the typewriter is ~40 lines of React.
- **Live data without a backend** — star counts come straight from the public GitHub API client-side,
  cached in `sessionStorage`, with baked fallbacks so the page never looks broken.
- **Visual language** — dark ink, Space Grotesk, teal→purple→amber gradient: the same family as
  [Spatial Deck](https://github.com/ibrews/spatial-deck) and the [Forage site](https://ibrews.github.io/forage-site/).

---

Built by [Alex Coulombe](https://github.com/ibrews) — with an AI co-pilot, naturally.
