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
| `/training` | The Unreal Authorized Training Center: 12 course tracks priced by tier ($99 intro / $200 advanced, booked via the store), a prominent company/team-training section (`#teams`), the full 50+ class ready-to-teach catalog (`#catalog`), and interest forms that ask "what would you like to learn?" |
| `/members` | Membership program — full infrastructure (entitlement-backed via `lib/commerce/membership.ts`), currently gated behind a "coming soon" banner with a founding waitlist; no price shown, nothing buyable until `NEXT_PUBLIC_MEMBERSHIP_LIVE=1` **and** a Stripe subscription path is added |
| `/account` | Magic-link sign-in, purchases/downloads, and sign-out (linked from footer + store success page) |
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
| `/store` | Direct sales (courses, skills, templates) — Stripe Checkout, no marketplace cut. Rule of thumb: anything ready-to-deliver has a price + instant checkout; anything in-progress collects an email instead. Ships in preview mode (inquiry fallback) until `NEXT_PUBLIC_STORE_LIVE=1` |
| `/newsletter` | Archive of every newsletter issue (markdown files in `content/newsletters/`) + subscribe form |
| `/support` | "Support the Lab" donations — Stripe Checkout with preset/custom amounts and an optional comment/request field |

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

Structured content (repos, products, timeline, courses, links) lives in [`lib/data.ts`](lib/data.ts);
the store catalog in [`lib/store.ts`](lib/store.ts); page prose in the page files under `app/`.

### Plain-English copy editing — [`CONTENT.md`](CONTENT.md)

To rewrite wording without touching code, edit **[`CONTENT.md`](CONTENT.md)** — a generated,
human-readable dump of *every* user-facing string on the site. Change the words after each `▸`;
leave the `[id]` tags alone. Lists (e.g. the rotating "Currently:" descriptors) are marked
`(N items — add or remove lines freely)` — add or delete `-` lines to grow or shrink them.

To insert a **line break** inside any string, type the literal token `<br>`:
```
▸ First line<br>Second line
```
The site renders it as a real `<br />`. Data strings (taglines, blurbs, story text, bullets)
all support this. The token round-trips through `gen-content` unchanged and is stripped
automatically from meta descriptions so SEO copy stays clean.

The round-trip:

```bash
node scripts/gen-content.mjs     # regenerate CONTENT.md + snapshot from source
#   …edit CONTENT.md…
node scripts/diff-content.mjs    # show exactly what changed, and which file each edit maps to
```

`diff-content` reports every reworded string and every list add/remove against
`content/strings.snapshot.json` (the baseline from the last `gen-content` run). Apply the changes
to the source files it names, then `gen-content` again to refresh the baseline. (Editing assistant:
"sweep the copy" runs `diff-content`, applies each change, rebuilds, and redeploys.)

## Store / payments

The point-of-sale bones live in [`lib/store.ts`](lib/store.ts) (catalog),
[`app/api/checkout/route.ts`](app/api/checkout/route.ts) (Stripe Checkout session — raw REST,
no SDK dependency), and [`app/api/stripe-webhook/route.ts`](app/api/stripe-webhook/route.ts)
(signature-verified fulfillment stubs). Stripe is a processor, not a marketplace — the only fee
anywhere is card processing; every item also offers a zero-fee invoice path by email.

To go live: copy [.env.example](.env.example) into Vercel env vars, set real prices in
`lib/store.ts` (all current prices are placeholders), wire the fulfillment TODOs in the webhook,
and flip `NEXT_PUBLIC_STORE_LIVE=1`. Until then the store runs in honest preview mode — buy
buttons open a pre-filled email. **Before listing anything also sold elsewhere, check the channel
terms** (Fab is non-exclusive for your own products; confirm Capafy's creator agreement; never
sell Epic-owned content off-Fab) — guardrail notes are in `lib/store.ts`.

## Signup lists & broadcasts

Every "join the waitlist / notify me / inquire" action on the site posts to
[`app/api/subscribe/route.ts`](app/api/subscribe/route.ts), which saves the signup to a
**Neon Postgres** database and emails `info@` a notification. The lists are defined in one place,
[`lib/lists.ts`](lib/lists.ts) (`forage`, `unrealitykit-bridge`, `pinchwork`, `unreal-visionos`,
`lab`, `skills`, `store`, plus `ai`/`unreal`). `ai` and `unreal` also mirror into Resend audiences
so training demand can be compared in the Resend dashboard. The shared UI is
[`components/WaitlistForm.tsx`](components/WaitlistForm.tsx) (+ the reveal wrapper
[`components/InquireButton.tsx`](components/InquireButton.tsx)), both with a honeypot + "I'm not a
robot" check.

Setup: provision Neon from the Vercel **Storage** tab (auto-injects `DATABASE_URL`), then
`vercel env pull .env.local`. Required env: `DATABASE_URL`, `RESEND_API_KEY`, `ADMIN_KEY`.

- **See counts / export a list (CSV):**
  `/api/admin/signups?key=$ADMIN_KEY` (all counts) ·
  `…&list=forage&format=csv` (download one list). Keep `ADMIN_KEY` private.

## Newsletter Studio

The whole newsletter operation runs from one local app — MailChimp-class, but
local-first (issues are git-versioned markdown, subscribers live in your own
Neon DB, sends go through your own Resend account):

```bash
cd /Users/alex/GH/alexcoulombepresents
npm run studio        # → http://localhost:4848
```

- **Dashboard** — every issue (draft/scheduled/sent + open/click stats),
  audience counts per list; sends completed by the production cron reconcile
  back into the local issue files automatically
- **Editor** — formatting toolbar, drag-drop images (auto-resized; two at once
  = side-by-side row), live email preview, test-send to yourself
- **Send flow** — pick one or MORE lists (a deduped union — nobody gets the
  issue twice), see the live combined count, and type that exact count to
  confirm; re-verified server-side at send time, and a UNIQUE send-claim row
  (`campaign_sends`) makes double-sends impossible even across machines
- **Scheduled sends** — pick a future time instead: the Studio writes the
  schedule into the issue, pushes it (and its images) straight to `main`,
  and PRODUCTION sends it at the chosen time via
  [`/api/cron/send-newsletter`](app/api/cron/send-newsletter/route.ts) —
  laptop closed is fine. Fired every 15 min by
  [`.github/workflows/newsletter-cron.yml`](.github/workflows/newsletter-cron.yml)
  (+ a daily Vercel cron backstop in `vercel.json`). One-time setup: set a
  `CRON_SECRET` env var in Vercel AND the same value as a GitHub Actions
  secret. Schedules >48h overdue are skipped, never silently mass-mailed.
- **Reports** — delivered / unique opens / unique clickers / top links /
  unsubscribes per campaign, self-hosted via `/api/t/o` (signed open pixel)
  and `/api/t/c` (signed click redirect) into an `email_events` table
- Every email also carries a "View this issue in your browser" link to its
  archive page, and the archive has an RSS feed at `/newsletter/feed.xml`

Requires `DATABASE_URL`, `RESEND_API_KEY`, and `AUTH_SECRET` in
**`.env.studio`** (preferred — `vercel env pull` keeps clobbering
`.env.local`, and never touches this file; `.env.local` still works as a
fallback). Values must match production, or unsubscribe/tracking links won't
verify on the live site. The UI shows status chips for whichever are missing
and degrades gracefully — notably, **scheduling works without local
Resend/auth keys**, since production does that sending. Every email automatically gets the attribution footer ("You're
receiving this because…") and a one-click unsubscribe link + List-Unsubscribe
headers ([`lib/sendNewsletter.ts`](lib/sendNewsletter.ts) is the single send
path). The CLI equivalent (same engine) is
`node scripts/broadcast.mjs --list newsletter --subject "…" --body issue.md --dry-run`.

## The HarvardXR slides & ethereal backgrounds

The About page embeds ports of slides 2–3 from the [HarvardXR keynote](https://ibrews.github.io/harvardxr-keynote/)
([`components/hxr/`](components/hxr/)): the Architecture/Theatre/Realtime-Tech Venn with the
orbiting pixel Alex, and the Mario power-up (click to play — all SFX synthesized via Web Audio).
Every page also gets a [Spatial Deck](https://github.com/ibrews/spatial-deck)-style ethereal
overlay ([`components/Ethereal.tsx`](components/Ethereal.tsx)): aurora (home/skills/store),
ghost (about/links), ember (training/videos), nebula (repos/lab).

## Architecture notes

- **No animation library** — reveals are an `IntersectionObserver` + CSS, the hero is a hand-rolled
  `<canvas>` particle field (respects `prefers-reduced-motion`), the typewriter is ~40 lines of React.
- **Live data without a backend** — star counts come straight from the public GitHub API client-side,
  cached in `sessionStorage`, with baked fallbacks so the page never looks broken.
- **Visual language** — dark ink, Space Grotesk, teal→purple→amber gradient: the same family as
  [Spatial Deck](https://github.com/ibrews/spatial-deck) and the [Forage site](https://ibrews.github.io/forage-site/).

---

Built by [Alex Coulombe](https://github.com/ibrews) — with an AI co-pilot, naturally.
