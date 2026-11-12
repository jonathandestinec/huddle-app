"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { identifyAttendeeAction } from "@/lib/auth/actions";

type IdentifyOptions = { emailOnly?: boolean };
type Ctx = { signedIn: boolean; ensureIdentity: (opts?: IdentifyOptions) => Promise<boolean> };
const IdentityContext = createContext<Ctx>({ signedIn: false, ensureIdentity: async () => false });
export const useIdentity = () => useContext(IdentityContext);

/**
 * Wraps the public event page. ensureIdentity() resolves true once the attendee
 * is signed in (asking for name + email if needed), false if they closed the sheet
 * or must confirm via email first.
 */
export function IdentityProvider({ signedIn: initial, callbackPath, children }: { signedIn: boolean; callbackPath: string; children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(initial);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [emailOnly, setEmailOnly] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ensureIdentity = useCallback(
    (opts?: IdentifyOptions) => {
      if (signedIn) return Promise.resolve(true);
      setEmailOnly(!!opts?.emailOnly);
      setOpen(true);
      setSent(false);
      return new Promise<boolean>((res) => (resolver.current = res));
    },
    [signedIn],
  );

  function close(ok: boolean) {
    setOpen(false);
    resolver.current?.(ok);
    resolver.current = null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const r = await identifyAttendeeAction({ name: emailOnly ? undefined : name, email, callbackPath });
    setPending(false);
    if (r.status === "signed_in") {
      setSignedIn(true);
      close(true);
    } else if (r.status === "check_email") {
      setSent(true);
    } else if ("message" in r) {
      setError(r.message);
    }
  }

  return (
    <IdentityContext.Provider value={{ signedIn, ensureIdentity }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={() => close(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md animate-[sheet-in_220ms_cubic-bezier(0.32,0.72,0,1)] rounded-t-3xl bg-paper p-6 pb-10 sm:rounded-3xl sm:pb-6"
          >
            {sent ? (
              <div className="text-center">
                <p className="font-serif text-3xl">Welcome back 👋</p>
                <p className="mt-2 text-slate">
                  We&apos;ve seen {email} before, so we emailed you a link to continue. Tap it and you&apos;ll come right back here.
                </p>
                <Button variant="secondary" className="mt-6" onClick={() => close(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <p className="font-serif text-3xl">Who&apos;s joining?</p>
                  <p className="text-sm text-slate">
                    {emailOnly ? "Just your email — no password. The host never sees it or who picked which number." : "Just your name and email — no password."}
                  </p>
                </div>
                {!emailOnly && (
                  <Field label="Your name">
                    <Input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                )}
                <Field label="Email" hint={emailOnly ? "Used for your receipt and payment only." : undefined} error={error}>
                  <Input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "One moment…" : "Continue"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </IdentityContext.Provider>
  );
}
