import { getFunctionDefinition } from "@/functions/registry";
import { IdentityProvider } from "@/functions/IdentifySheet";
import { ExtraContentCard } from "@/functions/extra-content/AttendeeCard";
import { listContent } from "@/functions/extra-content/logic";
import { NumberPickerCard } from "@/functions/number-picker/AttendeeCard";
import { getPickerState } from "@/functions/number-picker/logic";
import { getDeviceHash } from "@/lib/device";
import { RsvpCard } from "@/functions/rsvp/AttendeeCard";
import { hasSeat, seatsLeft } from "@/functions/rsvp/logic";
import type { SessionUser } from "@/lib/auth/session";
import type { Event, EventFunction } from "@/lib/events/service";
import { hasEntitlement } from "@/lib/gating/access";

async function renderCard(f: EventFunction, event: Event, viewer: SessionUser | null) {
  const def = getFunctionDefinition(f.type);
  const shell = { id: f.id, label: def.label, emoji: def.emoji, gate: f.gate, priceKobo: f.priceKobo };
  const unlocked = viewer ? await hasEntitlement(viewer.id, f.id) : false;
  const ended = event.status === "ended";

  switch (f.type) {
    case "rsvp":
      return (
        <RsvpCard
          key={f.id}
          fn={shell}
          unlocked={unlocked}
          hasSeat={viewer ? await hasSeat(viewer.id, f.id) : false}
          seatsLeft={await seatsLeft(f.id)}
          ended={ended}
        />
      );
    case "number_picker":
      return (
        <NumberPickerCard
          key={f.id}
          fn={shell}
          unlocked={unlocked}
          initial={await getPickerState(f.id, viewer?.id ?? null, await getDeviceHash())}
          ended={ended}
        />
      );
    case "extra_content":
      return <ExtraContentCard key={f.id} fn={shell} unlocked={unlocked} items={await listContent(f.id, viewer?.id ?? null)} />;
    default:
      return null;
  }
}

export async function FunctionCards({
  functions,
  event,
  orgSlug,
  viewer,
}: {
  functions: EventFunction[];
  event: Event;
  orgSlug: string;
  viewer: SessionUser | null;
}) {
  if (functions.length === 0) return null;
  const cards = await Promise.all(functions.map((f) => renderCard(f, event, viewer)));
  return (
    <IdentityProvider signedIn={!!viewer} callbackPath={`/${orgSlug}/${event.slug}`}>
      <div className="mt-8 space-y-4">{cards}</div>
    </IdentityProvider>
  );
}
