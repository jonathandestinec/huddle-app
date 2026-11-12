# 🐧 Huddle

**Where organisations bring their people together.**

Huddle is a modular event platform for churches, community groups, teams and NGOs. Organisations create events, attach **Functions** from the Function Store, and earn from gated access — paid via Paystack, or unlocked with an access code.

## Functions (v1)

| Function | What it does |
|---|---|
| **RSVP & Seats** | Seat reservations with capacity limits |
| **Number Picker** | Attendees pick their own number; hosts call numbers live |
| **Extra Content** | Recordings, notes and slides behind a payment or code |

Coming soon: Voting & Polls, Q&A Queue, Shoutout, Forum Access, Certificate.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Drizzle ORM on Neon Postgres · Better Auth (magic link + Google) · Paystack split payments · S3-compatible storage (Backblaze B2) · Resend · Vitest · Playwright

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run db:migrate
npm run dev
```

Create `.env.development.local` with `EMAIL_DEV_OUTBOX=1` to log emails (including sign-in links) to the console instead of sending them.

## Tests

```bash
npm test            # unit + integration (needs DATABASE_URL in .env.test pointing at a throwaway Neon branch)
npm run test:e2e    # Playwright end-to-end flow
```

## Docs

- Design spec: [`docs/superpowers/specs/2026-11-11-huddle-v1-design.md`](docs/superpowers/specs/2026-11-11-huddle-v1-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-11-12-huddle-v1.md`](docs/superpowers/plans/2026-11-12-huddle-v1.md)

---

Built by The Watchers Channel & Vivant Enterprises · Huddle © 2026
