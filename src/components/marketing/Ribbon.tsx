/**
 * The yellow ribbon of function names that winds under the hero (traced from the design, 1312px wide canvas).
 * Static, like the design. Drawn in design coordinates; the parent positions and scales it.
 */
const PATH =
  "M -30 694 C 110 684, 185 688, 220 740 C 252 790, 248 880, 285 948 C 315 1002, 372 1006, 425 988 C 498 962, 560 924, 640 914 C 702 908, 742 938, 800 984 C 868 1040, 928 1076, 990 1076 C 1052 1076, 1082 1028, 1112 958 C 1142 888, 1205 848, 1340 790";

const WORDS = ["Number Picker", "Forum Access", "Voting & Polls", "Locked Content", "Vault", "Hosts", "Q&A Queue", "Certificate", "RSVP & Seats", "Shoutout", "Physical Tickets"];
const GAP = "    ";

export function Ribbon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 640 1312 470" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <path id="huddle-ribbon" d={PATH} fill="none" stroke="#FEF16C" strokeWidth="40" strokeLinecap="butt" />
      <text fontFamily="var(--font-urbanist)" fontWeight="700" fontSize="22" fill="#1A1A1A" dy="7.5">
        <textPath href="#huddle-ribbon" startOffset="34">
          {WORDS.join(GAP)}
        </textPath>
      </text>
    </svg>
  );
}
