/** Hand-drawn-style Huddle penguin. `mood` changes the eyes/beak a little. */
export function Penguin({ size = 96, mood = "happy", className }: { size?: number; mood?: "happy" | "wave" | "sleepy"; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#1A1A1A" opacity="0.08" />
      <path d="M60 14c-22 0-34 20-34 46 0 28 12 48 34 48s34-20 34-48c0-26-12-46-34-46Z" fill="#1A1A1A" stroke="#1A1A1A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 36c-14 0-22 14-22 30 0 20 8 34 22 34s22-14 22-34c0-16-8-30-22-30Z" fill="#FAFAF8" />
      {mood === "sleepy" ? (
        <>
          <path d="M47 50q4 3 8 0" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M65 50q4 3 8 0" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="51" cy="49" r="3.5" fill="#1A1A1A" />
          <circle cx="69" cy="49" r="3.5" fill="#1A1A1A" />
          <circle cx="52.2" cy="47.8" r="1.1" fill="#fff" />
          <circle cx="70.2" cy="47.8" r="1.1" fill="#fff" />
        </>
      )}
      <path d="M54 57l6 7 6-7c-3-2-9-2-12 0Z" fill="#FEF16C" stroke="#1A1A1A" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="44" cy="62" rx="4" ry="2.5" fill="#FFB4A2" opacity="0.6" />
      <ellipse cx="76" cy="62" rx="4" ry="2.5" fill="#FFB4A2" opacity="0.6" />
      {mood === "wave" ? (
        <path d="M92 56c8-6 14-14 14-20" stroke="#1A1A1A" strokeWidth="9" strokeLinecap="round" />
      ) : (
        <path d="M93 64c5 8 6 18 3 24" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
      )}
      <path d="M27 64c-5 8-6 18-3 24" stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" />
      <path d="M46 106l-8 6h16M74 106l8 6H66" stroke="#FEF16C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
