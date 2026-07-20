import { test, expect } from "@playwright/test";

const DEMO_PASSWORD = "DevPassword123!";

test.describe("critical journeys", () => {
  test("patient can register and reach the portal", async ({ page }) => {
    const unique = Date.now();
    const email = `e2e.patient.${unique}@demo.sheffielddermatology.test`;
    await page.goto("/patient/register");
    await page.getByLabel("First name").fill("Ezra");
    await page.getByLabel("Last name").fill("Tester");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel(/Choose a password/).fill("E2ePassword123!");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/patient/);
    await expect(page.getByRole("heading", { name: /hello/i })).toBeVisible();
  });

  test("patient can complete a booking request", async ({ page }) => {
    await page.goto("/book");
    // Step 1: choose the first service and continue.
    await page.locator('input[name="service"]').first().check();
    await page.getByRole("button", { name: /choose date & time/i }).click();
    // Step 2: pick the first available day in the month calendar.
    const firstAvailableDay = page.locator(".cal-cell.available").first();
    await firstAvailableDay.waitFor({ state: "visible", timeout: 15000 });
    await firstAvailableDay.click();
    // Wait for slots to load, choose the first.
    const firstSlot = page.locator('input[name="slot"]').first();
    await firstSlot.waitFor({ state: "attached", timeout: 15000 });
    await firstSlot.check();
    await page.getByRole("button", { name: /enter your details/i }).click();
    // Step 3: details.
    await page.getByLabel(/First name/).fill("Book");
    await page.getByLabel(/Last name/).fill("Tester");
    await page.getByLabel(/Email address/).fill(`e2e.book.${Date.now()}@demo.test`);
    await page.locator('input[name="privacyConsent"]').check();
    await page.locator('input[name="cancellationConsent"]').check();
    await page.getByRole("button", { name: /send booking request|confirm booking/i }).click();
    await expect(page.getByText(/request received|appointment confirmed/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/not confirmed yet|confirmation email/i)).toBeVisible();
  });

  test("staff sign-in requires MFA", async ({ page }) => {
    await page.goto("/staff/sign-in");
    await page.getByLabel("Email address").fill("consultant@demo.sheffielddermatology.test");
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /continue/i }).click();
    // Password step must lead to the MFA challenge, never straight to the workspace.
    await expect(page).toHaveURL(/\/staff\/sign-in\/mfa/);
    await expect(page.getByRole("heading", { name: /two-step verification/i })).toBeVisible();
  });
});
