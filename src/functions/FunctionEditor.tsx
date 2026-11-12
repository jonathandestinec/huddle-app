"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Field, Input, cx } from "@/components/ui";
import { attachFunctionAction, removeFunctionAction, updateFunctionAction } from "@/lib/functions/actions";
import { ConfigFields } from "./ConfigFields";
import type { FunctionType, Gate } from "./types";

const GATES: { value: Gate; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "code", label: "Access code" },
];

export type EditorFunction = {
  id?: string;
  type: FunctionType;
  gate: Gate;
  priceNaira: string;
  config: Record<string, unknown>;
  hasCode: boolean;
};

export function FunctionEditor({
  eventId,
  initial,
  hasBank,
  onDone,
}: {
  eventId: string;
  initial: EditorFunction;
  hasBank: boolean;
  onDone?: () => void;
}) {
  const [gate, setGate] = useState<Gate>(initial.gate);
  const [price, setPrice] = useState(initial.priceNaira);
  const [code, setCode] = useState("");
  const [config, setConfig] = useState(initial.config);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    setError(undefined);
    setSaved(false);
    start(async () => {
      const payload = { gate, priceNaira: price, accessCode: code || undefined, config };
      const r = initial.id
        ? await updateFunctionAction(initial.id, payload)
        : await attachFunctionAction(eventId, { type: initial.type, ...payload });
      if (!r.ok) return setError(r.error);
      setSaved(true);
      setCode("");
      onDone?.();
    });
  }

  function remove() {
    if (!initial.id || !confirm("Remove this from the event?")) return;
    start(async () => {
      const r = await removeFunctionAction(initial.id!);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Decide who gets in, and how.</p>
        <div className="mt-2 inline-flex rounded-full bg-ink/5 p-1">
          {GATES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGate(g.value)}
              disabled={g.value === "paid" && !hasBank}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150",
                gate === g.value ? "bg-surface shadow-sm" : "text-slate hover:text-ink",
                g.value === "paid" && !hasBank && "cursor-not-allowed opacity-40",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        {!hasBank && (
          <p className="mt-2 text-xs text-slate">
            <Link href="/dashboard/onboarding/bank" className="underline">
              Link a bank account
            </Link>{" "}
            to charge for this.
          </p>
        )}
      </div>
      {gate === "paid" && (
        <Field label="Price (₦)" hint="Huddle keeps 5%. Paystack's fee comes out of your share.">
          <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1,000" />
        </Field>
      )}
      {gate === "code" && (
        <Field label="Access code" hint={initial.hasCode ? "Leave empty to keep the current code" : "At least 4 characters"}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={initial.hasCode ? "••••••" : "GRACE2026"} />
        </Field>
      )}
      <ConfigFields type={initial.type} config={config} onChange={setConfig} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : initial.id ? "Save" : "Attach"}
        </Button>
        {initial.id && (
          <Button variant="ghost" onClick={remove} disabled={pending}>
            Remove
          </Button>
        )}
        {saved && <span className="text-sm text-slate">Saved ✓</span>}
      </div>
    </div>
  );
}
