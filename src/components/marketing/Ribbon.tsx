"use client";
import { useSyncExternalStore } from "react";

const WORDS = ["Number Picker", "Forum Access", "Voting & Polls", "Locked Content", "Q&A Queue", "Certificate", "RSVP & Seats", "Shoutout"];
const TEXT = Array(3).fill(WORDS.join("   ·   ")).join("   ·   ");

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

/** The yellow wavy band of function names from the design, drifting slowly along its path. */
export function Ribbon() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 1312 420" className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-[200px] w-full sm:bottom-auto sm:top-[52%] sm:h-[420px]" aria-hidden="true" preserveAspectRatio="none">
      <path
        id="ribbon-path"
        d="M-40 40 C 120 20, 220 60, 260 160 C 300 270, 360 330, 470 300 C 600 260, 640 240, 760 280 C 900 330, 980 400, 1080 330 C 1180 260, 1230 160, 1360 120"
        fill="none"
        stroke="#FFE76C"
        strokeWidth="46"
        strokeLinecap="round"
      />
      <text fontFamily="var(--font-urbanist)" fontWeight="700" fontSize="22" fill="#1A1A1A" dy="8">
        <textPath href="#ribbon-path" startOffset="0">
          {TEXT}
          {!reduced && <animate attributeName="startOffset" from="0" to="-1600" dur="40s" repeatCount="indefinite" />}
        </textPath>
      </text>
    </svg>
  );
}
