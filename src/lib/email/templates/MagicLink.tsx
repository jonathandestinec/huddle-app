import { Button, Text } from "@react-email/components";
import { EmailLayout, buttonStyle, colors } from "./Layout";

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <EmailLayout preview="Your link to Huddle">
      <Text style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>Welcome back 👋</Text>
      <Text>Tap the button to sign in. No password needed.</Text>
      <Button href={url} style={buttonStyle}>
        Sign in to Huddle
      </Button>
      <Text style={{ color: colors.slate, fontSize: 13 }}>
        This link works once and expires in 5 minutes. If you didn&apos;t ask for it, you can ignore this email.
      </Text>
    </EmailLayout>
  );
}
