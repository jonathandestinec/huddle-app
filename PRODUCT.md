# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Organisers (primary):** people who run churches, community groups, schools, teams and NGOs in Nigeria and Ghana. They set up an organisation, create events, choose what attendees get, share one link, and run the event live. Most are not technical. Their job is to bring their people together and, when they choose to, earn from what they offer.
- **Attendees:** members of those communities, joining on their phones from a shared link (often WhatsApp). They give only a name and email (or, for email-only and anonymous Number Pickers, less), with no password, then claim a number, reserve a seat, pay, or unlock content.

## Product Purpose

Huddle is a modular event platform. An organisation creates an event, attaches **Functions** to it, and shares a link. Functions can be free, paid (Paystack), or unlocked with an access code. Money settles straight to the organisation's bank through Paystack split payments; Huddle keeps a 5% fee and never holds organiser funds.

Success means: an organiser goes from sign-up to a published, shareable event in under five minutes; an attendee on a phone joins, pays and unlocks without creating a password; a host can run the event live from one screen.

## Positioning

Huddle does not host video. It runs alongside the meeting people already use (Zoom, Google Meet, Teams, YouTube Live, or a room) and adds the parts those tools lack: numbered turns, seats, gated recordings and resources, and payment, assembled per event from Functions.

## Operating Context

- Market: Nigeria and Ghana, currency NGN, payments through Paystack.
- Events are church services, community meetings, classes and team gatherings, in person or online.
- Links travel mostly through WhatsApp and church or group announcements.
- Hosts run the live part from a laptop or projector (Host Live), calling numbers that update on every attendee's phone.

## Capabilities and Constraints

- **Live Functions:** RSVP & Seats (capacity limits), Number Picker (attendees pick a number; hosts call numbers live; modes: ask for names, email only, fully anonymous), Extra Content (recordings, notes, slides behind payment or code).
- **Coming soon:** Voting & Polls, Q&A Queue, Shoutout, Forum Access, Certificate. These must be labelled as coming soon wherever they appear.
- Gating per Function: free, paid, or access code. Fully anonymous Number Pickers cannot be paid (Paystack needs an email).
- Events can be duplicated as drafts to run again.
- Fee: 5% per transaction. Pro and Scale plans with lower fees are planned but not available.
- Not in scope: hosting video, subscriptions, native apps, refunds UI, analytics charts.
- Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Drizzle on Neon Postgres, Better Auth, Paystack, Resend, deployed on Vercel.

## Brand Commitments

- Name: **Huddle**. Tagline: "Where organisations bring their people together."
- Voice: warm and playful, in plain words for non-technical hosts. The penguin mascot is part of the character.
- The marketing page follows the owner's Figma design (`design/Desktop.png`); its layout, copy and palette are authoritative for that page.
- Built by The Watchers Channel & Vivant Enterprises.

## Evidence on Hand

- No real testimonials, customer logos, usage numbers or case studies yet. Never invent customers, quotes, statistics or press.
- The Watchers Channel is the first organisation, but is not confirmed as a public proof point.
- Partner logos shown under "Huddle Supports" (Meet, Teams, Zoom, Stripe, PayPal, Google) are tools Huddle works alongside, not endorsements.
- Landing assets: `public/landing/` (exported from Figma by the owner). Some design photos are still missing (phone-screen photo, chat avatars, the final Benefits photo).

## Product Principles

1. **One link, no passwords.** Every step an attendee takes should work on a phone from a shared link with the least information possible.
2. **The host stays in control.** Organisers choose exactly what each event offers, and can change, duplicate or end it without starting over.
3. **Privacy is a choice the host makes, and attendees can trust it.** When a host picks email-only or anonymous, identities are genuinely withheld.
4. **Money is honest and direct.** Fees are stated plainly; payouts go straight to the organisation's bank.
5. **Work alongside, not instead of.** Huddle adds to the meeting tools people already use; it never asks them to switch.
