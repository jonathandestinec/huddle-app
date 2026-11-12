"use client";
import { Choice, Field, Input } from "@/components/ui";
import { pickerMode, type PickerMode } from "./number-picker/config";
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
          <Choice<PickerMode>
            name="Who's picking"
            value={pickerMode(config)}
            onChange={(v) => onChange({ ...config, mode: v, anonymous: v === "anonymous" })}
            options={[
              { value: "named", label: "Ask for names", hint: "Name and email. You see who holds each number." },
              { value: "private", label: "Email only", hint: "Just an email, for receipts and payment. You never see who's who." },
              { value: "anonymous", label: "Fully anonymous", hint: "Nothing at all — one number per phone. Free or code only." },
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
