/**
 * The yellow ribbon of function names that winds under the hero (traced from the design's 1312px canvas).
 * The path runs well past both edges so it reaches the screen edges on wide monitors too.
 * Drawn 1:1 in design coordinates: the viewBox is 2900 wide, with the design canvas at x 0-1312.
 */
const LEAD_IN = 774; // length of the straight lead-in before the design's own path starts (x -800 to -30)

const PATH =
  "M -800 702 C -520 700, -250 697, -30 694 C 110 684, 185 688, 220 740 C 252 790, 248 880, 285 948 C 315 1002, 372 1006, 425 988 C 498 962, 560 924, 640 914 C 702 908, 742 938, 800 984 C 868 1040, 928 1076, 990 1076 C 1052 1076, 1082 1028, 1112 958 C 1142 888, 1205 848, 1340 790 C 1500 722, 1760 676, 2110 640";

const WORDS = [
  "RSVP & Seats", "Certificate", "Q&A Queue",
  "Number Picker", "Forum Access", "Voting & Polls", "Locked Content", "Vault", "Hosts", "Q&A Queue", "Certificate", "RSVP & Seats", "Shoutout", "Physical Tickets",
  "Number Picker", "Locked Content", "Voting & Polls", "Forum Access",
];
// The first three words sit on the lead-in, off-canvas on the design's own width.
const LEAD_WORDS = 3;
const GAP = "    ";

export function Ribbon({ className = "" }: { className?: string }) {
  const lead = WORDS.slice(0, LEAD_WORDS).join(GAP) + GAP;
  return (
    <svg viewBox="-794 640 2900 470" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <path id="huddle-ribbon" d={PATH} fill="none" stroke="#FEF16C" strokeWidth="40" strokeLinecap="butt" />
      <text fontFamily="var(--font-urbanist)" fontWeight="700" fontSize="22" fill="#1A1A1A" dy="7.5">
        {/* Lead-in words end just before the design's first word ("Number Picker") at offset LEAD_IN + 34. */}
        <textPath href="#huddle-ribbon" startOffset={LEAD_IN + 34} textAnchor="end">
          {lead}
        </textPath>
        <textPath href="#huddle-ribbon" startOffset={LEAD_IN + 34}>
          {WORDS.slice(LEAD_WORDS).join(GAP)}
        </textPath>
      </text>
    </svg>
  );
}
