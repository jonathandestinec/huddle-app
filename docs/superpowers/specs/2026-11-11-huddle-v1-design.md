# Huddle v1 — Design Spec

**Date:** 2026-11-11
**Target launch:** on or before 2026-11-19 (hard deadline 2026-11-20)
**Status:** Approved in brainstorming; awaiting written-spec review

---

## 1. Purpose & success criteria

Huddle is a modular event platform: organisations create events, attach **functions** to them, and earn from gated access. v1 is a **public launch** — any organisation can sign up — with The Watchers Channel as the first organisation to soft-launch.

v1 succeeds when:

1. An organiser can sign up, create an organisation, link a bank account, create an event, attach functions, and publish a shareable link — in under 5 minutes.
2. An attendee on a phone can open that link, register with only name + email, claim a number, pay via Paystack, and unlock content — without creating a password.
3. Money from paid functions settles directly to the organisation's bank via Paystack split payments, with Huddle's fee deducted automatically.
4. A host can run a live service from the Host Live screen, calling numbers that update on every attendee's screen.

### Confirmed context

- Responsive **web app**, mobile-first for attendees.
- Market: **Nigeria/Ghana**, currency **NGN**, payments via **Paystack**.
- Huddle does **not** host video. Live functions run alongside Zoom / YouTube / in-person meetings.
- Brand: per the Huddle Brand Document — Huddle Yellow `#FFE76C`, Near-black `#1A1A1A`, Off-white `#FAFAF8`, White `#FFFFFF`, Slate `#64748B`; Instrument Serif (headlines) + Urbanist (body/UI); penguin mascot; warm, playful voice.
- Marketing page design: `design/Desktop.png` (1312×27962 export of the Figma Sites "Home" page). App screens are **not** designed in Figma; they are designed from the brand doc to match the landing page.
- UI refinement (interactions, animation) uses Emil Kowalski's skills (`npx skills add emilkowalski/skills`), applied during build.

## 2. Scope

### In v1

| Area | Includes |
|---|---|
| Organiser auth | Email magic link + Google sign-in |
| Organisation | Name, slug, logo, bank details → Paystack subaccount. Single `owner` per org. |
| Events | Title, slug, description, cover image, start/end time, venue and/or meeting URL, status `draft` → `published` → `ended` |
| Functions | **RSVP & Seats**, **Number Picker**, **Extra Content** |
| Gating | Every function: `free`, `paid` (Paystack), or `code` (host-set access code) |
| Attendees | Name + email, no password; magic link to return; "My Huddles" page |
| Organiser dashboard | Event list, per-event overview (registrations, numbers taken, revenue), Host Live screen |
| Marketing site | Landing page built from `design/Desktop.png` |
| Emails | Magic link, registration confirmation, payment receipt |
| Platform monetisation | Transaction fee only: **5% (500 bps)** on all orgs |

### Not in v1

Subscriptions/tiers (Pro, Scale), Q&A, Polls, Shoutout, Forum, Certificates, RSVP waitlists, multi-member org roles, refunds UI, recurring events, analytics charts, SMS/phone auth, native apps.

## 3. Architecture

**Single Next.js application** (App Router, TypeScript, Tailwind CSS, Drizzle ORM) deployed on **Vercel**.

| Concern | Service | Fallback if it blocks us |
|---|---|---|
| Database | Neon Postgres | — |
| Auth | Neon Auth (magic link + Google) | Better Auth self-hosted on the same Neon DB |
| Realtime | Neon realtime | 3-second polling behind the same interface |
| File storage | Neon storage buckets | Vercel Blob |
| Payments | Paystack (subaccounts + split) | — |
| Email | Resend | — |
| Scheduled jobs | Vercel Cron | — |

Rule: every third-party dependency with a fallback is wrapped behind a small internal interface (`lib/auth`, `lib/realtime`, `lib/storage`) so swapping it does not touch feature code. If a Neon feature costs more than half a day of debugging, switch to the fallback.

### Money flow

- On org setup, Huddle creates a **Paystack subaccount** for the org's bank account (account name verified via Paystack's resolve endpoint).
- Checkout is initialised with `subaccount` = org's code and `transaction_charge` = Huddle's fee in kobo (`ceil(amount × fee_bps / 10000)`), `bearer: "subaccount"` — the org bears Paystack's processing fee.
- Huddle never holds organiser funds.
- Access is granted **only** on a verified Paystack webhook (`x-paystack-signature` HMAC-SHA512) or a server-side `transaction/verify` call on the return page — never on client redirect alone.

## 4. Data model

All money in **kobo** (integer). All timestamps `timestamptz`.

- **users** — managed by Neon Auth (id, email, name). Organisers and attendees are the same entity.
- **organisations** — id, name, slug (unique), logo_key, paystack_subaccount_code (nullable), bank_name, account_last4, fee_bps (default 500), created_at.
- **memberships** — user_id, organisation_id, role (`owner`). PK (user_id, organisation_id).
- **events** — id, organisation_id, slug (unique per org), title, description, cover_key, starts_at, ends_at, venue, meeting_url, status (`draft|published|ended`), created_at.
- **event_functions** — id, event_id, type (`rsvp|number_picker|extra_content`), gate (`free|paid|code`), price_kobo (required when paid), access_code_hash (required when code, bcrypt), config (jsonb, validated per type with Zod), position, created_at. One function of each type per event in v1.
- **entitlements** — id, user_id, event_function_id, source (`free|payment|code`), payment_id (nullable), created_at. UNIQUE (user_id, event_function_id). **The single source of truth for "is this person allowed".**
- **payments** — id, user_id, event_function_id, paystack_reference (unique), amount_kobo, huddle_fee_kobo, status (`pending|success|failed|abandoned`), metadata (jsonb, e.g. requested number), created_at, settled_at.
- **number_claims** — id, event_function_id, number (int), user_id, status (`held|confirmed`), hold_expires_at (nullable), called_at (nullable), created_at. **UNIQUE (event_function_id, number)**. One claim per user per number-picker function: UNIQUE (event_function_id, user_id).
- **rsvps** — id, event_function_id, user_id, created_at. UNIQUE (event_function_id, user_id).
- **content_items** — id, event_function_id, kind (`file|link`), title, storage_key (file) / url (link), mime_type, size_bytes, position.
- **code_attempts** — event_function_id, ip_hash, attempted_at (for rate limiting).

### Function configs

- `rsvp`: `{ capacity: number | null }`
- `number_picker`: `{ min: number, max: number }` (max − min ≤ 9,999)
- `extra_content`: `{}` (items live in `content_items`)

## 5. Modules

```
src/
  app/                      # routes (marketing, dashboard, public event, /me, api)
  lib/
    auth/                   # session helpers wrapping Neon Auth
    db/                     # Drizzle schema + client
    gating/                 # canAccess(), unlock flows (free | pay | code)
    payments/               # Paystack client, initCheckout, verifyWebhook, settle()
    realtime/               # subscribe(channel) / publish(channel, event)
    storage/                # upload, signedUrl
    email/                  # Resend templates
  functions/
    registry.ts             # type → module map (the Function Store)
    rsvp/                   # settings form, attendee card, server actions, logic
    number-picker/
    extra-content/
  components/               # shared UI, penguin illustrations
```

Each function module exports the same shape:

```ts
interface FunctionModule<Config> {
  type: FunctionType;
  label: string;               // "Number Picker"
  description: string;         // brand-voice one-liner
  configSchema: ZodType<Config>;
  SettingsForm: Component;     // organiser
  AttendeeCard: Component;     // public event page
  onEntitled?(ctx): Promise<void>; // side effects after unlock (e.g. confirm held number)
}
```

Adding Polls later = add a folder + one registry line.

### Gating contract (`lib/gating`)

- `getAccess(userId, functionId) → { state: "unlocked" | "locked", gate, priceKobo }`
- `unlockFree(userId, functionId)` → creates entitlement (source `free`).
- `unlockWithCode(userId, functionId, code)` → rate-limit check (5 / 10 min / function / IP), bcrypt compare, creates entitlement (source `code`).
- `startPaidUnlock(userId, functionId, metadata)` → creates `pending` payment, returns Paystack authorization URL.
- `settlePayment(reference)` → idempotent: in one transaction, mark payment `success`, create entitlement, call module `onEntitled`. Second call is a no-op.

## 6. Key flows

### Organiser onboarding
Sign in → "Create your organisation — it takes 2 minutes" (name, slug auto-suggested, logo) → bank step (bank list from Paystack, account number, resolved name shown for confirmation) → subaccount created. Bank step is skippable; paid gates are disabled until done.

### Create event
Event basics → "Pick what your event needs. Attach it. Done." — function cards to attach → per-function settings + gate → Publish → share link `/{org}/{event}`.

### Attendee: claim a number (paid)
1. Opens event page, taps Number Picker card → grid.
2. Not identified → name + email sheet → magic link session created inline (attendee stays on page; email link used only to return later).
3. Taps #42 → server inserts `number_claims` row `held`, `hold_expires_at = now + 10 min`. Unique-violation → "Someone just grabbed #42. Try another?"
4. Paystack checkout (metadata carries `claim_id`).
5. Webhook / return-page verify → `settlePayment` → entitlement + claim `confirmed` → realtime publish → all grids update.
6. Receipt email with the number.

Free gate: step 3 inserts `confirmed` directly with a `free` entitlement. Code gate: code entered first, then claim confirmed.

### Host Live
Organiser opens `/dashboard/events/:id/live` → full grid (claimed numbers show attendee name) → tap number → sets `called_at`, publishes `called` event → attendees see "Now calling #42" banner; their own number pulses if called. Projector-friendly large view.

### Extra Content
Locked card shows titles only. After entitlement: files served via 1-hour signed URLs, links shown directly. Server checks entitlement on every signed-URL request.

### RSVP & Seats
"Reserve my seat" → in a transaction, count RSVPs `FOR UPDATE` on the function row; reject if `count >= capacity` ("This one's full"). Paid/code gates apply before the RSVP is created.

## 7. Error handling & edge cases

| Case | Behaviour |
|---|---|
| Concurrent claim of same number | DB unique constraint; loser gets friendly retry message and refreshed grid |
| Abandoned payment | Vercel Cron every 5 min deletes `held` claims past `hold_expires_at`, marks payment `abandoned` if still pending |
| Duplicate/late webhook | `settlePayment` idempotent on `paystack_reference` |
| Payment succeeds after hold expired | If number still free → confirm it. If taken → entitlement is still granted; attendee is prompted to pick another number at no charge |
| Wrong access code | Generic "That code didn't work"; 5 attempts / 10 min per function per IP |
| Org without subaccount | `paid` gate option disabled in editor with setup prompt |
| Event `ended` | Number picker and RSVP read-only; Extra Content still accessible to entitled users |
| Invalid webhook signature | 401, logged, no state change |
| File upload limits | 500 MB per file; allowed types: pdf, mp3, m4a, mp4, mov, jpg, png |

## 8. UI & brand

- Tokens from the brand doc as CSS variables / Tailwind theme. Instrument Serif for headlines (italic for expressive moments), Urbanist for body/UI.
- Mobile-first public pages; dashboard responsive but desktop-optimised.
- Penguin illustrations in empty states, success moments (number claimed, content unlocked), and 404.
- Motion: refined with Emil Kowalski's skills — fast, spring-based "claim" and "unlock" moments, respectful of `prefers-reduced-motion`.
- Copy follows the brand voice table ("Decide who gets in, and how." not "Configure access conditions").

## 9. Testing

- **Unit (Vitest, TDD):** fee/split maths, gating decisions, code rate limiting, webhook signature verification, `settlePayment` idempotency (duplicate, late, expired-hold cases), config schemas.
- **Integration (Vitest against a Neon test branch):** 50 parallel claims on one number → exactly one confirmed; RSVP capacity under concurrency; hold sweep.
- **E2E (Playwright):** organiser creates event with all three functions → attendee claims a paid number with a Paystack **test** card → unlocks Extra Content → host calls the number and attendee sees it.
- Paystack test keys until E2E passes; live keys only at launch.

## 10. Launch plan

| Day | Dates | Work |
|---|---|---|
| 1–2 | Nov 12–13 | Repo, Next.js scaffold, brand tokens, Neon + Drizzle schema, auth (organiser + attendee magic link) |
| 3–4 | Nov 14–15 | Organisations, Paystack subaccount onboarding, events CRUD, function registry, gating |
| 5–6 | Nov 16–17 | Payments + webhook settlement, RSVP, Number Picker, Extra Content + storage |
| 7 | Nov 18 | Host Live + realtime, marketing landing page, emails, motion polish |
| 8 | Nov 19 | E2E pass, live keys, domain, soft launch with The Watchers Channel |

## 11. Open items (non-blocking)

- Production domain name.
- Paystack live account / business verification status (needed before live keys — start now, it can take days).
- Resend sending domain verification.
