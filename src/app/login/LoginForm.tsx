"use client";
import { useState } from "react";
import { Button, Field, Input } from "@/components/ui";
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
      <div className="mt-8 rounded-3xl bg-surface p-6" role="status">
        <p className="text-xl font-bold">Check your email ✉️</p>
        <p className="mt-2 text-slate">
          We sent a sign-in link to <strong className="text-ink">{email}</strong>. Open it on this phone or computer. It may take a minute — check your spam folder too.
        </p>
        <button type="button" onClick={() => setState("idle")} className="mt-4 min-h-12 font-semibold underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-5">
      <form onSubmit={sendLink} className="space-y-4">
        <Field label="Your email" hint="We'll email you a link to sign in — no password to remember." error={state === "error" ? "That didn't work. Check the email and try again." : undefined}>
          <Input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourchurch.org" />
        </Field>
        <Button type="submit" size="lg" disabled={state === "sending"} className="w-full">
          {state === "sending" ? "Sending…" : "Email me a sign-in link"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-sm text-slate">
        <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
      </div>
      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={() => authClient.signIn.social({ provider: "google", callbackURL })}>
        Continue with Google
      </Button>
    </div>
  );
}
