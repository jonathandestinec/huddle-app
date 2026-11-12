"use client";
import { Choice, Field, Input } from "@/components/ui";
import type { FunctionType } from "./types";

/** Per-function settings shown in the store. Extra Content items are managed separately. */
export function ConfigFields({
  type,
  config,
  onChange,
}: {
  type: FunctionType;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  if (type === "rsvp") {
    return (
      <Field label="How many seats?" hint="Leave empty if there's no limit.">
        <Input
          inputMode="numeric"
          value={config.capacity == null ? "" : String(config.capacity)}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            onChange({ capacity: v ? Number(v) : null });
          }}
          placeholder="No limit"
        />
      </Field>
    );
  }
  if (type === "number_picker") {
    const num = (k: "min" | "max") => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...config, [k]: Number(e.target.value.replace(/\D/g, "") || 0) });
    return (
      <div className="space-y-5">
        <div>
          <p className="mb-2 font-semibold">Who&apos;s picking?</p>
          <Choice
            name="Who's picking"
            value={config.anonymous ? "anonymous" : "named"}
            onChange={(v) => onChange({ ...config, anonymous: v === "anonymous" })}
            options={[
              { value: "named", label: "Ask for names", hint: "People give their name and email. You see who holds each number." },
              { value: "anonymous", label: "Anonymous", hint: "No names or emails — one number per phone. You just see the count." },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Input inputMode="numeric" value={String(config.min ?? "")} onChange={num("min")} />
          </Field>
          <Field label="To">
            <Input inputMode="numeric" value={String(config.max ?? "")} onChange={num("max")} />
          </Field>
        </div>
      </div>
    );
  }
  return null;
}
