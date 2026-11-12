import { z } from "zod";

export const extraContentConfigSchema = z.object({}).strict();
export type ExtraContentConfig = z.infer<typeof extraContentConfigSchema>;
