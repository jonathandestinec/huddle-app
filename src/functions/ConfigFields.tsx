"use client";
import { Field, Input } from "@/components/ui";
import type { FunctionType } from "./types";

/** Per-function settings fields shown in the store. Extra Content items are managed separately. */
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
      <Field label="How many seats?" hint="Leave empty for no limit">
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lowest number">
          <Input inputMode="numeric" value={String(config.min ?? "")} onChange={num("min")} />
        </Field>
        <Field label="Highest number">
          <Input inputMode="numeric" value={String(config.max ?? "")} onChange={num("max")} />
        </Field>
      </div>
    );
  }
  return null;
}
