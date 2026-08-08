import { test, expect } from "@playwright/test";
import { mockAllAPIs, MOCK_AUTH_SETUP, createTestSessionToken } from "./helpers";

const COOKIE_NAME = "session";

test.describe("Auth Flow", () => {
  test("login page renders with setup mode when no users exist", async ({ page }) => {
    await page.route("**/api/auth/status", (route) =>
      route.fulfill({ status: 200, json: MOCK_AUTH_SETUP })
    );

    await page.goto("/login");

    await expect(page.getByText("ShopeeAff Platform")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Akun & Masuk" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("login page renders normal mode when users exist", async ({ page }) => {
    await page.route("**/api/auth/status", (route) =>
      route.fulfill({ status: 200, json: { needsSetup: false } })
    );

    await page.goto("/login");

    await expect(page.getByText("ShopeeAff Platform")).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Akun & Masuk" })).not.toBeVisible();
  });

  test("login form submits and redirects to dashboard", async ({ page }) => {
    await page.route("**/api/auth/status", (route) =>
      route.fulfill({ status: 200, json: { needsSetup: false } })
    );
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({ status: 200, json: { success: true, redirect: "/dashboard" } })
    );

    await page.goto("/login");

    await page.getByLabel("Email").fill("test@test.com");
    await page.getByLabel("Password").fill("password123");

    // Set session cookie before clicking — the mocked login API doesn't set real cookies
    const token = await createTestSessionToken();
    await page.context().addCookies([
      { name: COOKIE_NAME, value: token, domain: "localhost", path: "/" },
    ]);

    await page.getByRole("button", { name: "Masuk" }).click();

    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("login shows error toast on invalid credentials", async ({ page }) => {
    await page.route("**/api/auth/status", (route) =>
      route.fulfill({ status: 200, json: { needsSetup: false } })
    );
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({ status: 401, json: { error: "INVALID_CREDENTIALS" } })
    );

    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@test.com");
    await page.getByLabel("Password").fill("wrongpass");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Email atau password salah")).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated access to /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to API returns 401", async ({ request }) => {
    const res = await request.get("/api/shopee/products");
    expect(res.status()).toBe(401);
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Click logout
    await page.getByRole("button", { name: "Keluar" }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
