"use client";
import { playSound, setMuted, useMuted } from "@/lib/sound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const muted = useMuted();
  return (
    <button
      type="button"
      aria-label={muted ? "Turn sounds on" : "Turn sounds off"}
      aria-pressed={!muted}
      onClick={() => {
        setMuted(!muted);
        if (muted) playSound("tap");
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-base transition-transform duration-150 active:scale-90 hover:bg-ink/5 ${className}`}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
