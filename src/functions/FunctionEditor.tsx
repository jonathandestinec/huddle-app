"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Choice, Field, Input } from "@/components/ui";
import { attachFunctionAction, removeFunctionAction, updateFunctionAction } from "@/lib/functions/actions";
import { ConfigFields } from "./ConfigFields";
import { pickerMode } from "./number-picker/config";
import type { FunctionType, Gate } from "./types";

const GATES: { value: Gate; label: string; hint: string }[] = [
  { value: "free", label: "Everyone, free", hint: "Anyone with the link." },
  { value: "paid", label: "People who pay", hint: "They pay with card or transfer." },
  { value: "code", label: "People with a code", hint: "You share a secret code." },
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

  const anonymous = initial.type === "number_picker" && pickerMode(config) === "anonymous";
  const paidBlockedReason = !hasBank ? (
    <>
      <Link href="/dashboard/onboarding/bank" className="font-semibold underline">
        Add your bank account
      </Link>{" "}
      first.
    </>
  ) : anonymous ? (
    "Not with fully anonymous picking — Paystack needs an email. Choose “Email only” instead."
  ) : undefined;

  return (
    <div className="space-y-6">
      <ConfigFields
        type={initial.type}
        config={config}
        onChange={(c) => {
          setConfig(c);
          if (initial.type === "number_picker" && pickerMode(c) === "anonymous" && gate === "paid") setGate("free");
        }}
      />
      <div>
        <p className="mb-2 font-semibold">Who can use it?</p>
        <Choice
          name="Who can use it"
          value={gate}
          onChange={setGate}
          options={GATES.map((g) => ({
            ...g,
            disabled: g.value === "paid" && !!paidBlockedReason,
            disabledHint: paidBlockedReason,
          }))}
        />
      </div>
      {gate === "paid" && (
        <Field label="Price (₦)" hint="Huddle keeps 5%. Paystack's small fee comes out of your share.">
          <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1,000" />
        </Field>
      )}
      {gate === "code" && (
        <Field label="Access code" hint={initial.hasCode ? "Leave empty to keep the current code." : "At least 4 letters or numbers. Share it with your members."}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={initial.hasCode ? "••••••" : "GRACE2026"} />
        </Field>
      )}
      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-800">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : initial.id ? "Save changes" : "Add to event"}
        </Button>
        {initial.id && (
          <Button variant="danger" onClick={remove} disabled={pending}>
            Remove
          </Button>
        )}
        {saved && <span className="font-medium text-emerald-800">Saved ✓</span>}
      </div>
    </div>
  );
}
