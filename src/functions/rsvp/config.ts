import { z } from "zod";

export const rsvpConfigSchema = z.object({
  capacity: z.number().int().positive().max(100000).nullable(),
});
export type RsvpConfig = z.infer<typeof rsvpConfigSchema>;
