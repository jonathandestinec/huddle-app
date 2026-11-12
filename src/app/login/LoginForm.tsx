"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function LoginForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await authClient.signIn.magicLink({ email, callbackURL });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <div className="mt-8 rounded-2xl bg-surface p-6 shadow-sm">
        <p className="font-semibold">Check your inbox ✉️</p>
        <p className="mt-1 text-slate">We sent a sign-in link to {email}.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <form onSubmit={sendLink} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 outline-none focus:border-ink"
          placeholder="you@yourchurch.org"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full rounded-full bg-huddle-yellow px-5 py-3 font-bold transition active:scale-[0.97] disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Email me a link"}
        </button>
        <p className="text-center text-xs text-slate">We&apos;ll send you a link — no password needed.</p>
        {state === "error" && <p className="text-sm text-red-600">That didn&apos;t work. Try again?</p>}
      </form>
      <div className="flex items-center gap-3 text-xs text-slate">
        <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
      </div>
      <button
        type="button"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL })}
        className="w-full rounded-full border border-ink/15 bg-surface px-5 py-3 font-semibold transition active:scale-[0.97]"
      >
        Continue with Google
      </button>
    </div>
  );
}
