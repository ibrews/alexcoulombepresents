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
| `/members/recordings` | Members-only class-recording library (gated on the `membership` entitlement; entries in `lib/recordings.ts` — interim thumbnail + link list until the HLS player lands). Slide decks and handouts attach via `materials`, pointing at the class-materials registry |
| `/materials` | Class-material folders — one per class. **Members see every folder; a single-class buyer sees the folder for the class they bought.** Access is derived, never granted by hand: `lib/commerce/materialAccess.ts` unions the `membership` entitlement with non-refunded `catalog_orders` rows, so a refund closes access on its own. Folder + file registry in `lib/classMaterials.ts` |
| `/materials/[slug]` | One class's folder. Each file declares a `source`: `local` (streamed from `content/materials/`, never `public/`), `r2` (short-lived presigned URL), or `external` (an existing Dropbox/Drive link — the redirect is gated, the underlying URL is not). All three go through `/api/materials?class=…&key=…` so the access check lives in exactly one place |
| `/account` | Magic-link sign-in, purchases/downloads, membership card (class credits, recording library, Stripe Customer Portal), and sign-out (linked from footer + store success page) |
| `/repos` | Curated open-source catalog by category — each repo gets its own beautifully formatted page linking to its living GitHub wiki |
| `/repos/[slug]` | Per-repo deep dive: story, highlights, clone command, live stars |
| `/skills` | AI skills for Claude Code — live on Capafy (ue5-testflight, ios-testflight), in the pipeline (godot-visionos, spatial-deck-maker, app-store-aso, metahuman-godot-pipeline), and free open source |
| `/videos` | Curated YouTube videos by theme + real channel playlists, with click-to-load embeds |
| `/lab` | Teaser for upcoming products (the private repos) |
| `/lab/forage` | Forage — AI-first asset scout for your owned Fab library |
| `/lab/unrealitykit-bridge` | UnRealityKit Bridge — UE simulation + RealityKit rendering |
| `/lab/pinchwork` | Pinchwork — universal OpenXR hand tracking template |
| `/lab/avp-openxr` | Apple Vision Pro + OpenXR engine work — punch-list fixes, Lumen, Nanite research (`/lab/unreal-visionos` redirects here) |
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

### Class materials

Folders and files are declared in [`lib/classMaterials.ts`](lib/classMaterials.ts). A folder's
`slug` must equal the [`lib/store.ts`](lib/store.ts) item slug for the class — that equality is
what lets a purchase unlock it, and `tests/class-materials.test.ts` fails the build if it drifts.

**The normal case is a shared Drive/Dropbox folder per class.** Share the folder however you like,
then paste the link:

```ts
materials: [sharedFolder({ url: "https://drive.google.com/drive/folders/…" })],
```

The site decides who is *shown* the link (members, plus anyone with a paid order for that class)
— the same rule the folder's real Drive permissions are kept in sync with by the daily
[Class-materials Drive access sync](#class-materials-drive-access-sync) below. Sharing the folder
"however you like" only needs to happen once, as **Editor**, with
`acp-drive-access@agile-lens-reminders.iam.gserviceaccount.com` — the cron grants everyone else
real, named-person reader access automatically from there. **Never set a folder's general access
to "Anyone with the link"**: that was the actual root cause of a real access gap (folders were
gated in the app but not actually shared with anyone, so paying buyers hit "Access Denied" until
2026-08-31) and "anyone with the link" was explicitly rejected as the fix in favor of real
per-person grants — see the section below.

Small files (decks, PDFs) can also be committed to `content/materials/` as `{ kind: "local" }` —
genuinely gated, streamed by our route. Never put them in `public/`; the CDN serves that with no
auth at all.

For a file that must expire, or one big enough that Drive's per-file download quota could lock it
(a 6 GB project across a full class is squarely in that range), use R2 instead:

```bash
node scripts/upload-class-material.mjs <local-file> <r2-key> --env <file-with-R2-creds>
```

The `<r2-key>` must match the entry's `source.key`. The uploader always uses multipart because
R2 caps a single PUT at 5 GiB, and it verifies the stored byte count before reporting success.
Credentials come from the Cloudflare dashboard (R2 → Manage API tokens), **not** `vercel env
pull` — they're marked Sensitive there and pull back as the literal string `[SENSITIVE]`.

A file whose R2 object isn't uploaded yet renders as "Uploading — not available yet" rather than
a Download button that 503s.

**Recordings don't go in the Drive folder — they're YouTube, via [`lib/recordings.ts`](lib/recordings.ts).**
Set a folder's `recordingSlug` to cross-link one; anyone who can already open the folder (member or
this-session buyer) gets a direct "Watch the recording →" link on `/materials/<slug>` — no need to
duplicate the video into Drive, and no bounce through the members-only `/members/recordings` library,
which is a separate perk (every class you *didn't* attend, not the one you bought).

**Reruns** (the same class taught again on a later date) are a new [`lib/store.ts`](lib/store.ts) item
with a new, dated slug and a new `classFolders` entry — never edit an existing entry's date in place.
The slug is the purchase key: two sessions sharing one slug would merge their buyers' access.
`tests/store.test.ts` and `tests/class-materials.test.ts` both fail the build on that mistake, the
second one by asserting `canOpen()` directly rather than just the data shape — buying session A must
never open session B, title collision or not.


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

### Renewal reminders

[`lib/commerce/renewalReminders.ts`](lib/commerce/renewalReminders.ts) (decision logic,
dependency-injected and unit-tested) + [`app/api/cron/membership-renewal-reminders`](app/api/cron/membership-renewal-reminders/route.ts)
warn an active member **7 days and 1 day** before their subscription renews — same daily cron slot
as the rest of the site's crons. Built 2026-08-31 so a promotional/legacy price expiring, or any
base-price change Alex makes directly on a subscription in Stripe, is a heads-up instead of a
surprise line on a card statement.

- **Idempotency**: a `membership_reminders` table (schema.ts) claims each `(customer, cycle, kind)`
  slot atomically — keyed on the entitlement's `updates_until` rather than a flag column on the
  entitlements row itself, since that row's `updates_until` keeps extending forward on every
  renewal and a flag there would need resetting each cycle or it'd silently suppress every future
  reminder after the first.
- **Self-healing, not "exactly on day N"**: a reminder fires once its window is *entered*
  (days-remaining ≤ 7 or ≤ 1) and hasn't been claimed yet — so a missed cron run still catches up
  the next day instead of silently dropping that member's warning, and a member already inside a
  window the first time this code ever runs for them gets the reminder immediately rather than
  waiting for a day that's already in the past.
- **The renewal price is read live from Stripe's `/v1/invoices/upcoming`**
  (`fetchUpcomingRenewalAmountCents`, `lib/commerce/membership.ts`) — never assumed from
  `MEMBERSHIP_TIERS`' current listed price. That's the only source that's automatically correct
  whether or not a member's subscription price has actually been changed, and whether any
  promotional coupon on it is still active or has expired. A failed lookup degrades the email to
  the tier's listed price with an explicit "may differ, check your billing portal" caveat rather
  than stating a number that could be wrong.
- **Email** (`sendMembershipRenewalReminder`, `lib/commerce/email.ts`): next charge, current tier's
  full benefit list, a one-line summary of the other two tiers for anyone considering an
  upgrade/downgrade, a link to `/account` (Stripe Customer Portal) to change or cancel, and the
  usual "reply or write info@alexcoulombepresents.com" — BCCs Alex on every send, same rule as the
  welcome email.
- Tests: [`tests/renewal-reminders.test.ts`](tests/renewal-reminders.test.ts), including the
  catch-up-after-an-outage case and the "don't double-send on a retried run" case.

### Class-materials Drive access sync

[`lib/commerce/driveAccessSync.ts`](lib/commerce/driveAccessSync.ts) (decision logic,
dependency-injected and unit-tested) + [`app/api/cron/sync-drive-access`](app/api/cron/sync-drive-access/route.ts)
keep the Google Drive permissions behind class-material links aligned with the site's access rules.
Folders are shared with real named people, never "anyone with the link" — that is a deliberate
access policy, not a future cleanup item.

- **Members**: every active member receives reader access to every Drive-backed class folder.
- **Individual buyers**: each non-refunded buyer receives reader access only to the folder whose
  slug they purchased; unmatched slugs and non-Drive materials are skipped.
- **Drive client**: [`lib/commerce/driveAccess.ts`](lib/commerce/driveAccess.ts) uses the built-in
  Node crypto APIs and raw `fetch` for service-account OAuth and named-user permission grants — no
  Google SDK dependency. Each grant is best-effort, so one rejected folder never stops the rest.
- **Schedule**: the authenticated cron runs daily at 14:00 UTC and deliberately no-ops when
  `GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY` is unset.
- Tests: [`tests/drive-access-sync.test.ts`](tests/drive-access-sync.test.ts) cover member and buyer
  targeting, missing-folder skips, per-grant failures, summary counts, and Drive URL parsing.

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
[`lib/lists.ts`](lib/lists.ts) (`forage`, `unrealitykit-bridge`, `pinchwork`, `avp-openxr`,
`lab`, `skills`, `store`, plus `ai`/`unreal`; `unreal-visionos` stays defined but retired, kept
only so old signups and the newsletter's historical `sentList` still resolve to a real label).
`ai` and `unreal` also mirror into Resend audiences
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
