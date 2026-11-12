import { expect, type Page } from "@playwright/test";

/** Signs in through the magic link captured by the dev outbox. */
export async function signInWithMagicLink(page: Page, email: string, callbackURL = "/dashboard") {
  await page.request.post("/api/auth/sign-in/magic-link", { data: { email, callbackURL } });
  let link: string | undefined;
  await expect
    .poll(async () => {
      const res = await page.request.get(`/api/dev/outbox?to=${encodeURIComponent(email)}`);
      const body = (await res.json()) as { links: string[] } | null;
      link = body?.links.find((l) => l.includes("magic-link/verify"));
      return link;
    })
    .toBeTruthy();
  await page.goto(link!);
}

export const uniq = () => Math.random().toString(36).slice(2, 8);
