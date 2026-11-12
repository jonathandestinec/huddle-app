import { z } from "zod";

export const numberPickerConfigSchema = z
  .object({
    min: z.number().int().min(0),
    max: z.number().int(),
    /** No names or emails: one pick per phone, counted not identified. */
    anonymous: z.boolean().default(false),
  })
  .refine((c) => c.max > c.min, { message: "The highest number must be bigger than the lowest" })
  .refine((c) => c.max - c.min <= 9999, { message: "Up to 10,000 numbers per event" });
export type NumberPickerConfig = z.infer<typeof numberPickerConfigSchema>;
