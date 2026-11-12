"use client";
import { useSyncExternalStore } from "react";

/**
 * Tiny synthesized UI sounds (Web Audio — no files). Quiet, short, and only after a user gesture.
 *   tap  — main button press        pop  — something good happened (claimed, reserved, unlocked)
 *   ding — your number was called   bonk — gentle "that didn't work"
 */
export type SoundName = "tap" | "pop" | "ding" | "bonk";

const KEY = "huddle:muted";
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

function readMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readMuted,
    () => false,
  );
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(a: AudioContext, opts: { type: OscillatorType; from: number; to?: number; at?: number; dur: number; gain: number }) {
  const t0 = a.currentTime + (opts.at ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.from, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
}

export function playSound(name: SoundName) {
  if (readMuted()) return;
  const a = audio();
  if (!a) return;
  switch (name) {
    case "tap":
      return tone(a, { type: "triangle", from: 900, to: 620, dur: 0.045, gain: 0.05 });
    case "pop":
      tone(a, { type: "sine", from: 620, to: 1180, dur: 0.09, gain: 0.08 });
      return tone(a, { type: "sine", from: 1180, to: 1400, at: 0.06, dur: 0.07, gain: 0.04 });
    case "ding":
      tone(a, { type: "sine", from: 880, dur: 0.5, gain: 0.09 });
      return tone(a, { type: "sine", from: 1320, at: 0.12, dur: 0.6, gain: 0.07 });
    case "bonk":
      return tone(a, { type: "sine", from: 240, to: 150, dur: 0.12, gain: 0.07 });
  }
}
