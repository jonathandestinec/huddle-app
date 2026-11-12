import { z } from "zod";

/**
 * Who's picking:
 * - named: name + email; the host sees who holds each number.
 * - private: email only (Paystack needs one, so it can be paid); the host never sees who's who.
 * - anonymous: nothing at all; one pick per phone. Free or access code only.
 */
export const PICKER_MODES = ["named", "private", "anonymous"] as const;
export type PickerMode = (typeof PICKER_MODES)[number];

export const numberPickerConfigSchema = z
  .preprocess(
    // Older configs only had `anonymous: boolean`.
    (raw) => {
      if (!raw || typeof raw !== "object") return raw;
      const r = raw as Record<string, unknown>;
      return r.mode === undefined ? { ...r, mode: r.anonymous ? "anonymous" : "named" } : r;
    },
    z
      .object({
        min: z.number().int().min(0),
        max: z.number().int(),
        mode: z.enum(PICKER_MODES).default("named"),
      })
      .refine((c) => c.max > c.min, { message: "The highest number must be bigger than the lowest" })
      .refine((c) => c.max - c.min <= 9999, { message: "Up to 10,000 numbers per event" }),
  )
  .transform((c) => ({ ...c, anonymous: c.mode === "anonymous", hideIdentity: c.mode !== "named" }));
export type NumberPickerConfig = z.infer<typeof numberPickerConfigSchema>;

/** The mode of a raw (possibly older, possibly unsaved) config — safe on the client. */
export function pickerMode(config: Record<string, unknown> | null | undefined): PickerMode {
  const m = config?.mode;
  if (m === "named" || m === "private" || m === "anonymous") return m;
  return config?.anonymous ? "anonymous" : "named";
}
