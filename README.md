# alexcoulombepresents.com

The personal site of **Alex Coulombe** — Unreal Engine, Godot, Apple Vision Pro, AI agents, live
immersive theatre, and Manhattan's first Unreal Authorized Training Center. Replaces the old
Google Sites page with something interactive, dynamic, and worthy of the domain.

Built with **Next.js 15 + Tailwind CSS 4**, zero other runtime dependencies. Deploys to Vercel
with no configuration.

## Pages

| Route | What it is |
|---|---|
| `/` | Hero with an interactive particle constellation that doubles as a knowledge graph — twelve of the dots are real destinations, drawn fresh on every visit from a pool of 416 links across four tiers, and hovering one locks it in place, names it, and sends soft ripples lapping through the surrounding dots (`lib/heroLinks.ts` + `lib/heroLinkPool.ts` + `lib/linkNodes.ts`) — plus a rotating-role typewriter, featured repos with live GitHub star counts, and an optional orbitable Gaussian Splat viewer (activates once `public/hero.splat` exists — see `components/SplatHero.tsx`) |
| `/about` | The architect → XR-chitect story, interactive career timeline, stats |
| `/training` | The Unreal Authorized Training Center: 12 course tracks priced by tier ($99 intro / $200 advanced, booked via the store), a prominent company/team-training section (`#teams`), the full 50+ class ready-to-teach catalog (`#catalog`), and interest forms that ask "what would you like to learn?" |
| `/members` | Membership program — full infrastructure (entitlement-backed via `lib/commerce/membership.ts`, Stripe subscription webhook branches wired via `lib/commerce/membershipBilling.ts`, real "Join the membership" checkout via `components/JoinMembershipButton.tsx`), publicly gated behind a "coming soon" banner with a founding waitlist until `NEXT_PUBLIC_MEMBERSHIP_LIVE=1` + the per-tier Stripe prices in `STRIPE_MEMBERSHIP_PRICE_ID_STARTER`/`_UNLIMITED`/`_INSIDER`. Live, it shows the three tier cards (Starter $200 / Unlimited $350 / Insider $500 per month) instead of the waitlist; post-checkout redirects to `/members?joined=1` |
| `/members/recordings` | Members-only class-recording library (gated on the `membership` entitlement; entries in `lib/recordings.ts` — interim link list until the HLS player lands) |
| `/account` | Magic-link sign-in, purchases/downloads, membership card (class credits, recording library, Stripe Customer Portal), and sign-out (linked from footer + store success page) |
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
2. **Hover one of the big haloed dots in the hero** — it locks in place, names where it goes, and
   sends a soft ripple lapping through the dots around it. Click it to travel there. Then reload:
   you get a different twelve. Teal is a nav page, grape a section, amber something specific
   (a 2015 meetup talk, one repo), sky a link that leaves the site. They stand down below 1024px,
   where the hero copy needs the whole screen.
3. **Press `⌘K`** (or `Ctrl+K`) anywhere — a command palette jumps you to any page, repo, or
   product. Type "godot" and hit Enter.
4. **Enter the Konami code** (`↑ ↑ ↓ ↓ ← → ← → B A`) — the site briefly enters immersive mode,
   locked at 90 fps, naturally.
5. **Open a repo page** (e.g. `/repos/blueprint-auto-layout`) and watch the star count — it's
   fetched live from the GitHub API with a baked fallback, so it's always current.
6. **Visit `/links` and click "Visit anyway (brave)"** under the vintage alexcoulombe.com card.
   You were warned.
7. **Play a video on `/videos`** — embeds are click-to-load (zero YouTube JS until you press play),
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

### Hero constellation links — `npm run gen:hero-links`

The hero draws its dozen dots from a pool of every destination on the site.
[`lib/heroLinkPool.ts`](lib/heroLinkPool.ts) models most of it from the data modules
(repos, lab products, all 100+ appearances, newsletter issues, classes, press). The links that
exist only in page JSX are discovered by parsing a real build:

```bash
npm run build && npm run gen:hero-links
```

That writes [`lib/heroLinkPool.generated.ts`](lib/heroLinkPool.generated.ts) (committed, same
round-trip as `gen-content`) and prints coverage. It refuses to write from a dev-server build —
`npm run dev` rewrites `.next`, which would otherwise leave it finding nothing and blanking the
file. Re-run it whenever pages gain or lose links.

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

### Membership billing

The membership subscription lifecycle is fully wired end-to-end — Join button, checkout, webhook
fulfillment, welcome email, portal — and rehearsed against real Stripe test-mode events (not just
unit fixtures).

**Three tiers**, each its own Stripe Product and Price, defined in
[`lib/commerce/membership.ts`](lib/commerce/membership.ts)'s `MEMBERSHIP_TIERS` and pointed at by
`STRIPE_MEMBERSHIP_PRICE_ID_STARTER` / `_UNLIMITED` / `_INSIDER`: **Starter $200/mo** (3 pooled
class credits per cycle), **Unlimited $350/mo**, **Insider $500/mo** (both unlimited — they skip
the credit system entirely). Prices were raised from $99/$149/$299 on 2026-08-12.

Each tier gets its own Stripe *Product* deliberately: they briefly shared one, which made Checkout
show the same product name no matter which tier a buyer picked. When raising prices, add a NEW
Price to the EXISTING product rather than creating a new product, and **add the outgoing price ID
to `LEGACY_MEMBERSHIP_PRICE_IDS`** in the webhook before swapping the env var — Stripe never
migrates existing subscriptions, so a price this list forgets is a live subscriber whose renewals
silently stop granting access.

- **Join flow**: [`components/JoinMembershipButton.tsx`](components/JoinMembershipButton.tsx) →
  `POST /api/checkout` with `{ membership: true }` → a real `mode=subscription` Stripe Checkout
  Session referencing the Price object directly (not inline `price_data`, unlike the one-time
  items) → success redirects to `/members?joined=1`. The branch re-checks `MEMBERSHIP_LIVE`
  server-side regardless of whether the button is rendered.
- **Webhook fulfillment**: [`lib/commerce/membershipBilling.ts`](lib/commerce/membershipBilling.ts)
  (decision logic, dependency-injected and unit-tested) +
  [`lib/commerce/membership.ts`](lib/commerce/membership.ts) (persistence). `invoice.paid`
  grants/extends the `membership` entitlement and, for Starter only, mints that tier's
  `booking_credit` entitlements for the cycle (Unlimited/Insider are uncapped and never touch the
  credit system); first grant only sends the welcome email — renewals don't;
  `customer.subscription.updated/deleted` revokes on cancellation; refunds revoke that cycle's
  entitlements through the existing `charge.refunded` branch. Everything is idempotent against
  webhook retries and dashboard resends. **The membership grant is a DB-level atomic upsert**
  (partial unique index `entitlements_one_membership_per_customer`, schema.ts) — a real rehearsal
  showed Stripe firing `customer.subscription.updated` and `invoice.paid` within milliseconds of
  each other, and a naive check-then-insert let both race past the check and create duplicate
  rows. A check-then-act pattern here is a bug, not a simplification.
- **Welcome email**: [`lib/commerce/email.ts`](lib/commerce/email.ts)'s `sendMembershipWelcomeEmail`
  (magic-link sign-in, mirrors the digital-purchase pattern). `brandedHtml()` — the shared
  template every transactional email on the site uses — got a `<meta charset="utf-8">` fix here
  too; without it, em-dashes/bullets can render as mojibake in some email clients (discovered by
  actually rendering the output, not just reading the source).
- Members manage billing via the Stripe Customer Portal
  ([`app/api/account/portal/route.ts`](app/api/account/portal/route.ts), linked from `/account`;
  activated in both Stripe test and live mode), and class-credit redemption is an admin honor
  system for now (`GET/POST /api/admin/credits?key=ADMIN_KEY` —
  [`app/api/admin/credits/route.ts`](app/api/admin/credits/route.ts)).
- Webhook-branch tests run with `npm test` (Node's built-in runner, Stripe fixture payloads —
  [`tests/membership-webhook.test.ts`](tests/membership-webhook.test.ts)), including cases only
  found by running the real flow (e.g. Stripe's transient `customer.subscription.created` with
  `status=incomplete` before a Checkout-driven subscription goes active).

### Zoom auto-invite

[`lib/zoom.ts`](lib/zoom.ts) wraps the "ZoomClaude" Server-to-Server OAuth app so buyers and
members get registered on the right Zoom meeting automatically instead of clicking a registration
link themselves. Needs `ZOOM_ACCOUNT_ID` / `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET`; with them
unset the whole feature no-ops and everyone falls back to the registration link, exactly as before
it existed.

- **Classes**: a `wednesdayCalendar` item with a `zoomMeetingId` auto-registers its buyer from the
  stripe-webhook fulfillment branch. Create a class's meeting with
  `node scripts/zoom/create-class-meeting.mjs --topic "…" --start 2026-09-02T15:00:00Z` — it
  prints the `zoomRegistrationUrl` + `zoomMeetingId` lines to paste into
  [`lib/store.ts`](lib/store.ts). Classes without a `zoomMeetingId` simply don't auto-register.
- **Office hours**: a *fresh* Zoom meeting every Friday, so its ID can't live in code — it's kept
  in the `zoom_meetings` table and refreshed by a daily cron
  ([`/api/cron/office-hours-meeting`](app/api/cron/office-hours-meeting/route.ts)).
  `POST /api/admin/credits` with `{"for":"office_hours"}` then registers the member on that week's
  meeting as part of burning their credit, and reports `zoomRegistered` so a failure is visible
  rather than silent. `node scripts/zoom/create-office-hours-meeting.mjs` is the manual escape
  hatch; it's the same idempotent function the cron calls.
- **Every Zoom call is best-effort and independently caught** — a Zoom outage can never fail an
  already-charged purchase or an already-spent credit.
- `node scripts/zoom/audit-class-meeting-ids.mjs` pairs each class to its real meeting by
  registration URL and flags any that are missing or *mismatched* — a wrong ID would auto-register
  buyers onto the wrong meeting, which is worse than not registering them.
- Scopes needed on the Zoom app: `meeting:write:meeting:admin`, `meeting:write:registrant:admin`
  (+ `meeting:read:list_meetings:admin` for the audit script). They're edited in Zoom's
  **Developer** console (`marketplace.zoom.us/develop/apps/<id>/scope`) — *not* the
  Marketplace-Admin "Apps on account" page, which has no Scopes tab at all.

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

## Support

If you like seeing this kind of thing get built and shared, [donations are always welcome](https://www.alexcoulombepresents.com/support) — they buy hardware, render time, and the freedom to keep giving most of this away.

---

Built by [Alex Coulombe Presents](https://github.com/ibrews) — with an AI co-pilot, naturally.
