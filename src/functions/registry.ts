import { extraContentConfigSchema } from "./extra-content/config";
import { numberPickerConfigSchema } from "./number-picker/config";
import { rsvpConfigSchema } from "./rsvp/config";
import type { FunctionDefinition, FunctionType } from "./types";

/**
 * The Function Store. Adding a function = add a folder + one entry here
 * (and its UI in ui-registry.tsx). Later tasks attach onEntitled hooks.
 */
const definitions: Record<FunctionType, FunctionDefinition<any>> = {
  rsvp: {
    type: "rsvp",
    label: "RSVP & Seats",
    description: "Let people reserve a seat. Set a limit if space is tight.",
    emoji: "🪑",
    configSchema: rsvpConfigSchema,
    defaultConfig: { capacity: null },
    // Lazy import keeps the registry free of import cycles (logic → gating → registry).
    onEntitled: (ctx) => import("./rsvp/logic").then((m) => m.rsvpOnEntitled(ctx)),
  },
  number_picker: {
    type: "number_picker",
    label: "Number Picker",
    description: "Everyone picks their own number. You call them out live.",
    emoji: "🔢",
    configSchema: numberPickerConfigSchema,
    defaultConfig: { min: 1, max: 100 },
    onEntitled: (ctx) => import("./number-picker/logic").then((m) => m.numberPickerOnEntitled(ctx)),
  },
  extra_content: {
    type: "extra_content",
    label: "Extra Content",
    description: "Share recordings, notes and slides with the people you choose.",
    emoji: "🎧",
    configSchema: extraContentConfigSchema,
    defaultConfig: {},
  },
};

export const ALL_FUNCTION_TYPES = Object.keys(definitions) as FunctionType[];

export function getFunctionDefinition(type: FunctionType): FunctionDefinition<any> {
  return definitions[type];
}

/** Shown in the store as "Coming soon". */
export const COMING_SOON = [
  { label: "Voting & Polls", emoji: "📊", description: "Live polls with real-time results." },
  { label: "Q&A Queue", emoji: "🙋", description: "Moderated questions with host controls." },
  { label: "Shoutout", emoji: "📣", description: "Paid live messages from your audience." },
  { label: "Forum Access", emoji: "💬", description: "A private discussion space per event." },
  { label: "Certificate", emoji: "🎓", description: "Auto-generated certificates after the event." },
];
