import { expect, test } from "@playwright/test";
import { signInWithMagicLink, uniq } from "./helpers";

test("anonymous picker: no name asked, one number per phone, host sees a count", async ({ browser, page }) => {
  const id = uniq();
  await signInWithMagicLink(page, `anon-org-${id}@huddle.test`);
  await page.getByPlaceholder("The Watchers Channel").fill(`Anon Church ${id}`);
  await page.getByRole("button", { name: "Create organisation" }).click();
  await expect(page).toHaveURL(/onboarding\/bank/);

  await page.goto("/dashboard/events/new");
  await page.getByPlaceholder("Sunday Service").fill("Prophecy Night");
  await page.locator('input[type="datetime-local"]').first().fill("2026-12-06T19:00");
  await page.getByRole("button", { name: "Create event" }).click();
  await expect(page).toHaveURL(/step=functions$/);
  const eventUrl = page.url().split("?")[0];

  await page.getByRole("button", { name: "Number Picker: add to event" }).click();
  await page.getByRole("radio", { name: /Anonymous/ }).click();
  await expect(page.getByRole("radio", { name: /People who pay/ })).toBeDisabled();
  await page.getByRole("button", { name: "Add to event", exact: true }).click();
  await expect(page.getByRole("button", { name: "Number Picker: change settings" })).toContainText("Anonymous");

  await page.getByRole("tab", { name: /Share/ }).click();
  await page.getByRole("button", { name: "Publish event" }).click();
  const publicUrl = await page.getByRole("link", { name: /See what people see/ }).getAttribute("href");

  const phone = await (await browser.newContext()).newPage();
  await phone.goto(publicUrl!);
  await phone.getByRole("button", { name: "Number 7", exact: true }).click();
  await expect(phone.getByText("Who's joining?")).toHaveCount(0);
  await expect(phone.locator('[aria-live="polite"]')).toContainText("7");
  // Same phone can't take a second number.
  await phone.reload();
  await expect(phone.getByText("Your number", { exact: true })).toBeVisible();

  await page.goto(`${eventUrl}/live`);
  await expect(page.getByText(/1 person has picked a number \(anonymous\)/)).toBeVisible();
});
