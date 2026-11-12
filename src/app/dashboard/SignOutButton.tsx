"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Account"
        onClick={() => setOpen(!open)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-ink font-semibold uppercase text-huddle-yellow"
      >
        {email[0]}
      </button>
      {open && (
        <div className="absolute right-0 top-14 w-64 origin-top-right animate-[sheet-in_180ms_var(--ease-out)] rounded-2xl bg-surface p-2 shadow-lg ring-1 ring-ink/8">
          <p className="truncate px-3 py-2 text-sm text-slate">{email}</p>
          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
            }}
            className="flex min-h-12 w-full items-center rounded-xl px-3 font-semibold hover:bg-ink/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
