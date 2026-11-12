import { expect, test } from "@playwright/test";
import { signInWithMagicLink, uniq } from "./helpers";

test("organiser sets up an event, attendee claims a number, host calls it", async ({ browser, page }) => {
  const id = uniq();
  const orgName = `E2E Church ${id}`;

  // ── Organiser ──
  await signInWithMagicLink(page, `organiser-${id}@huddle.test`);
  await expect(page.getByText("Create your organisation")).toBeVisible();
  await page.getByPlaceholder("The Watchers Channel").fill(orgName);
  await page.getByRole("button", { name: "Create organisation" }).click();
  await expect(page).toHaveURL(/onboarding\/bank/);

  await page.goto("/dashboard/events/new");
  await page.getByPlaceholder("Sunday Service").fill("E2E Service");
  await page.locator('input[type="datetime-local"]').first().fill("2026-12-06T09:00");
  await page.getByRole("button", { name: "Create event" }).click();
  await expect(page).toHaveURL(/dashboard\/events\/[0-9a-f-]{36}\?step=functions$/);
  const eventUrl = page.url().split("?")[0];

  await page.getByRole("button", { name: "Number Picker: add to event" }).click();
  await page.getByRole("button", { name: "Add to event", exact: true }).click();
  await expect(page.getByRole("button", { name: "Number Picker: change settings" })).toBeVisible();

  await page.getByRole("button", { name: "RSVP & Seats: add to event" }).click();
  await page.getByRole("button", { name: "Add to event", exact: true }).click();
  await expect(page.getByRole("button", { name: "RSVP & Seats: change settings" })).toBeVisible();

  await page.getByRole("tab", { name: /Share/ }).click();
  await page.getByRole("button", { name: "Publish event" }).click();
  await expect(page.getByText("Your event is live 🎉")).toBeVisible();
  const publicUrl = await page.getByRole("link", { name: /See what people see/ }).getAttribute("href");
  expect(publicUrl).toBeTruthy();

  // ── Attendee (separate browser context, no cookies) ──
  const attendeeCtx = await browser.newContext();
  const attendee = await attendeeCtx.newPage();
  await attendee.goto(publicUrl!);
  await attendee.getByRole("button", { name: "Number 42", exact: true }).click();
  await expect(attendee.getByText("Who's joining?")).toBeVisible();
  await attendee.locator('input[autocomplete="name"]').fill("Grace Eze");
  await attendee.locator('input[autocomplete="email"]').fill(`grace-${id}@huddle.test`);
  await attendee.getByRole("button", { name: "Continue" }).click();
  await expect(attendee.getByText("Your number", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(attendee.locator('[aria-live="polite"]')).toContainText("42");

  await attendee.getByRole("button", { name: "Reserve my seat" }).click();
  await expect(attendee.getByText("You're on the list ✓")).toBeVisible({ timeout: 20_000 });

  // ── Host calls #42; attendee sees it live ──
  await page.goto(`${eventUrl}/live`);
  await page.getByRole("button", { name: "Call next number" }).click();
  await expect(attendee.getByText("It's your turn")).toBeVisible({ timeout: 10_000 });

  await attendeeCtx.close();
});
