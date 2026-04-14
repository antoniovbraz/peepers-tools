import { test, expect } from "@playwright/test";

test.describe("Auth flow (unauthenticated)", () => {
  test("redirects to /auth when visiting root", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("redirects to /auth when visiting /create directly", async ({ page }) => {
    await page.goto("/create");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("redirects to /auth when visiting /settings directly", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("auth page shows Google login button", async ({ page }) => {
    await page.goto("/auth");
    // Auth page should render and contain a login mechanism
    await expect(page.locator("text=Google")).toBeVisible({ timeout: 10000 });
  });

  test("auth page shows Peepers branding", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("img[alt*='Peepers']").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("404 page", () => {
  test("shows not found page for unknown routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    // Should either show 404 or redirect to auth
    const url = page.url();
    const is404 = await page.locator("text=404").isVisible().catch(() => false);
    const isAuth = url.includes("/auth");
    expect(is404 || isAuth).toBe(true);
  });
});
