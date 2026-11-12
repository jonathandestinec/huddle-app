import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
const oscillators: unknown[] = [];

class FakeAudioContext {
  currentTime = 0;
  state = "running";
  destination = {};
  resume() {}
  createOscillator() {
    const o = { type: "", frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (g: unknown) => g, start() {}, stop() {} };
    oscillators.push(o);
    return o;
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (d: unknown) => d };
  }
}

beforeEach(() => {
  store.clear();
  oscillators.length = 0;
  vi.stubGlobal("window", {});
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
});

describe("sounds", () => {
  it("plays when not muted", async () => {
    const { playSound } = await import("@/lib/sound");
    playSound("tap");
    expect(oscillators.length).toBe(1);
  });

  it("stays silent when muted, and remembers the choice", async () => {
    const { playSound, setMuted } = await import("@/lib/sound");
    setMuted(true);
    expect(store.get("huddle:muted")).toBe("1");
    playSound("ding");
    expect(oscillators.length).toBe(0);
  });
});
