import { test, expect } from "@playwright/test";

test.describe("public website", () => {
  test("home page renders the brand and key CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Sheffield Dermatology/);
    await expect(page.getByRole("link", { name: /book an appointment/i }).first()).toBeVisible();
    await expect(page.getByAltText("Sheffield Dermatology").first()).toBeVisible();
  });

  test("condition pages are reachable and include urgent-care signposting", async ({ page }) => {
    await page.goto("/conditions/mole-assessment");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/999/)).toBeVisible();
  });

  test("fees page does not invent prices", async ({ page }) => {
    await page.goto("/fees");
    await expect(page.getByText(/confirmed when you book|being finalised/i).first()).toBeVisible();
  });

  test("legal pages are marked draft where appropriate", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  test("robots and sitemap are served", async ({ request }) => {
    expect((await request.get("/robots.txt")).status()).toBe(200);
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    const health = await request.get("/api/health");
    expect(health.status()).toBe(200);
    expect((await health.json()).status).toBe("ok");
  });

  test("authenticated areas redirect to sign in", async ({ page }) => {
    await page.goto("/patient");
    await expect(page).toHaveURL(/\/patient\/sign-in/);
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/staff\/sign-in/);
  });
});
