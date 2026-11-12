import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export const colors = { yellow: "#FEF16C", ink: "#1A1A1A", paper: "#FAFAF8", slate: "#64748B" };

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.paper, fontFamily: "Urbanist, Helvetica, Arial, sans-serif", color: colors.ink }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px" }}>
          <Text style={{ fontSize: 22, fontFamily: "Georgia, serif", margin: "0 0 24px" }}>🐧 Huddle</Text>
          <Section style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 24 }}>{children}</Section>
          <Text style={{ color: colors.slate, fontSize: 12, marginTop: 24 }}>
            Where organisations bring their people together.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const buttonStyle = {
  backgroundColor: colors.yellow,
  color: colors.ink,
  borderRadius: 999,
  padding: "12px 22px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
