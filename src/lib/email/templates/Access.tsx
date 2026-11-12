import { Button, Text } from "@react-email/components";
import { EmailLayout, buttonStyle, colors } from "./Layout";

export function AccessEmail({
  kind,
  name,
  eventTitle,
  orgName,
  when,
  functionLabel,
  number,
  amount,
  url,
}: {
  kind: "receipt" | "registered";
  name: string;
  eventTitle: string;
  orgName: string;
  when: string;
  functionLabel: string;
  number?: number | null;
  amount?: string | null;
  url: string;
}) {
  return (
    <EmailLayout preview={number != null ? `Your number is #${number}` : `You're in for ${eventTitle}`}>
      <Text style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>Hi {name.split(" ")[0]} 👋</Text>
      <Text>
        You&apos;re in for <strong>{eventTitle}</strong> with {orgName} — {when}.
      </Text>
      {number != null && (
        <Text style={{ fontSize: 44, fontFamily: "Georgia, serif", margin: "8px 0" }}>#{number}</Text>
      )}
      <Text style={{ color: colors.slate }}>
        {functionLabel}
        {kind === "receipt" && amount ? ` · Paid ${amount}` : ""}
      </Text>
      <Button href={url} style={buttonStyle}>
        Open the event
      </Button>
    </EmailLayout>
  );
}
