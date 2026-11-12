---
name: Huddle
description: Where organisations bring their people together.
colors:
  huddle-yellow: "#FEF16C"
  huddle-yellow-deep: "#F7E544"
  ink: "#1A1A1A"
  paper: "#FFFFFF"
  mist: "#EFEDE7"
  slate: "#5F5A68"
  huddle-purple: "#7160EE"
  huddle-coral: "#ED6A5B"
  note-yellow: "#F9EC84"
  note-lilac: "#EBD2F9"
  note-green: "#ABE69E"
  note-blue: "#BEE1E3"
  tile-cream: "#FBFAF8"
  supports-cream: "#FFFBE6"
  danger: "#B4483C"
typography:
  display:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "4.75rem"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Instrument Serif, ui-serif, Georgia, serif"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 0.97
  title:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    lineHeight: 1.1
  body:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.26
  label:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  field: "16px"
  card: "28px"
  tile: "80px"
  panel: "120px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  section: "200px"
components:
  button-primary:
    backgroundColor: "{colors.huddle-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.huddle-yellow-deep}"
    textColor: "{colors.ink}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "48px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.card}"
    padding: "28px"
  choice-selected:
    backgroundColor: "rgb(254 241 108 / 0.2)"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
  chip-live:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Huddle

## Overview

**Creative North Star: "The Community Noticeboard"**

Huddle looks like the noticeboard in a church hall or community centre: sticky notes pinned at slight angles, hand-drawn doodles, a strip of bright yellow tape, and a programme you can read at a glance. It is warm, handmade and welcoming, built for organisers who are not technical and attendees who arrive on a phone from a WhatsApp link.

The marketing page is the loudest expression of the board: full-bleed coloured panels (purple, black, coral), tilted sticky notes, line illustrations, and big Instrument Serif headlines. The app (dashboard, event editor, host live, attendee pages) is the same world at rest: white paper, soft pill controls, yellow for the one thing to do, black used sparingly for what is selected or live. Expression lives in details there, not in volume.

Everything is soft and friendly. Corners are generous, outlines are gentle, and nothing is sharp or clinical.

**Key Characteristics:**
- White paper ground with yellow as the single action colour and black as the anchor.
- Instrument Serif for headlines, Urbanist for everything you read or press.
- Pill buttons, big rounded cards and fields with clear but gentle outlines.
- Hand-drawn line illustrations and doodles instead of icons in boxes.
- Flat surfaces; depth only on things that truly float.

## Colors

One bright yellow, one black, white paper, and a small family of noticeboard pastels for the marketing page.

### Primary
- **Huddle Yellow** (`huddle-yellow`): the action colour. Primary buttons, the selected step number, the dot in a Live badge, picked numbers on the host grid, the highlighted calendar day. It marks what to do next.
- **Pressed Yellow** (`huddle-yellow-deep`): hover and pressed state of anything yellow.

### Secondary
- **Noticeboard Purple** (`huddle-purple`): the "What is Huddle?" panel on the landing page.
- **Pinboard Coral** (`huddle-coral`): the Benefits board on the landing page, ruled with white lines.

### Tertiary
- **Sticky Note Yellow, Lilac, Green, Blue** (`note-yellow`, `note-lilac`, `note-green`, `note-blue`): the four sticky notes. Note green also colours the chat "sent" bubble and the online dot.
- **Cream Tile** (`tile-cream`): the soft tile behind each feature illustration.
- **Supports Cream** (`supports-cream`): text and logos on the black "Huddle Supports" band.

### Neutral
- **Ink** (`ink`): text, outlines on landing components, selected tabs and badges, the Host it live card, dark marketing panels.
- **Paper** (`paper`): every page background and card surface.
- **Mist** (`mist`): one tone below paper. Tab tracks, secondary buttons in the app, quiet fields, the event-link box.
- **Slate** (`slate`): secondary text, hints, dates.
- **Danger** (`danger`): destructive actions and error text.

### Named Rules
**The One Yellow Job Rule.** Yellow marks the thing to do or the thing that is yours. If more than one or two yellow fills compete on an app screen, demote the extras to white or mist.

**The Black Is Punctuation Rule.** In the app, black appears in small, deliberate places: text, the selected tab, Live and Added badges, the radio dot, one dark feature card. It never becomes a page background or a border on everything.

## Typography

**Display Font:** Instrument Serif (with Georgia)
**Body Font:** Urbanist (with system sans-serif)
**Widget Font:** Inter, only inside the landing page's date picker, as drawn in the Figma.

**Character:** A slightly condensed, editorial serif for headlines paired with a round geometric sans for reading and controls. The serif carries the warmth of a printed programme; the sans keeps forms and buttons plain and legible.

### Hierarchy
- **Display** (Instrument Serif 400, 76px, leading 0.86): the hero headline. Italic is used for one word ("monetize"); a grey (#656565) word may soften the end of a line.
- **Headline** (Instrument Serif 400, 64–72px, leading ~0.97): section titles ("What is Huddle?", "Features", "How It Works") and app page titles at smaller sizes (40–48px).
- **Title** (Urbanist 500, 32–48px, leading 1.1): step titles and card headings.
- **Body** (Urbanist 400, 17–20px, leading 24px): paragraphs and descriptions, kept to about 370–600px measure.
- **Label** (Urbanist 600, 12–14px): badges, small meta text. Sentence case, never tracked capitals.

### Named Rules
**The Serif Speaks Once Rule.** Each block has one serif headline. Body, labels and buttons are always Urbanist.

## Layout

The marketing page is built on a 1280px content width. Coloured panels span the full width with very large rounded corners; text inside sits on a 133px inner margin. Sections are separated by generous vertical space (roughly 150–450px on desktop). Feature rows alternate a 551px illustration tile with a 370px text column. The exact Figma layout applies from 1280px up; below that, sections stack into a single column with smaller type, and section links move into a menu.

The app uses a 1024px (max-w-5xl) container with a 16px phone gutter, one column per step in the event editor, and a sticky step bar. Controls are at least 48px tall.

## Elevation & Depth

Flat by default. Surfaces are separated by white-on-white with a light outline, or by a tone step to mist, never by resting shadows. Shadows appear only on things that float over the page: the sticky save bar, sheets and menus.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 2px 4px rgb(26 26 26 / 0.04), 0 18px 40px -18px rgb(26 26 26 / 0.2)`): floating bars, sheets and the mobile menu.

### Named Rules
**The Pinned, Not Floating Rule.** Things on the board sit flat on it. Only things you can move or dismiss get a shadow.

## Shapes

Generous, rounded, friendly. Pills for buttons and badges; 16px for fields and choice cards; 28px for app cards; 40px for illustration frames; 80px for feature tiles; 110–120px for the large marketing panels. Sticky notes are the exception: square-cornered paper, rotated about ±10°, pinned with a push pin. Illustrations are hand-drawn line art with rounded stroke ends.

## Components

### Buttons
- **Shape:** fully rounded pill, 44–50px tall.
- **Primary:** Huddle Yellow fill, ink text, Urbanist 500–600. Hover deepens the yellow; press scales to 0.97.
- **Outline:** white with a 1px ink outline on the landing page; fills ink with white text on hover.
- **Secondary (app):** white with a gentle 1.5px outline at 20% ink.
- **Dark:** ink fill, white text; used rarely (for example on the yellow full-screen host view).
- **Focus:** a 4px soft ring, never the browser default.

### Chips and badges
- **Live:** ink pill, white text, small yellow dot.
- **Added:** ink pill, white text, "✓ Added · Free".
- **Draft / Ended:** mist pill.
- **Feature chips (landing):** white outline pills on black; the first one yellow and tilted.

### Cards / Containers
- **Corner Style:** 28px in the app.
- **Background:** paper, with a light 12% ink outline.
- **Selected / Added:** faint yellow tint (Huddle Yellow at 20%) with an 80% ink outline.
- **Internal Padding:** 20–28px.

### Inputs / Fields
- **Style:** white, 1.5px outline at 25% ink, 16px corners, 48px tall.
- **Hover:** outline darkens to 40%.
- **Focus:** outline goes near-black with a soft yellow ring.
- **Error:** danger-coloured message under the field.

### Navigation
- **Landing:** wordmark with the two-bar logo mark, four text links with an underline that draws in on hover, yellow "Join The Huddle" pill. Below 1280px, links move into a black rounded menu.
- **App:** sticky white bar with the penguin, org name, Events and Payouts links, sound toggle, and a black account circle with a yellow initial. Event steps sit in a mist track; the selected step is an ink pill with a yellow number.

### Sticky note (signature)
A square, slightly rotated note in one of the four note colours, with a line illustration, an Urbanist 700 title and a short body line, pinned by a push pin over a red pin hole. Used on the coral Benefits board.

## Do's and Don'ts

### Do:
- **Do** keep yellow for the main action and for "yours / selected" highlights.
- **Do** use Instrument Serif for headlines only and Urbanist for everything else.
- **Do** give fields a visible outline (1.5px at 25% ink) so they read as inputs at a glance.
- **Do** mark selected cards and choices with the faint yellow tint and ink outline together.
- **Do** use hand-drawn line illustrations from `public/landing/` for decoration.

### Don't:
- **Don't** use purple, lilac or sky as accents in the app; they belong to the marketing page.
- **Don't** add shadows, gradients or glass blur to resting surfaces.
- **Don't** make black heavy in the app: no black page backgrounds or thick black borders everywhere.
- **Don't** use tracked uppercase labels or emoji in coloured squares as icons.
- **Don't** invent customers, testimonials or statistics in any visual.
