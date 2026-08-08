import { test, expect } from "@playwright/test";
import { mockAllAPIs } from "./helpers";

test.describe("Settings Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test("Shopee credentials section shows configured status", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Shopee Affiliate API")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Configured: test-app-id")).toBeVisible();
    await expect(page.getByRole("button", { name: "Test Connection" })).toBeVisible();
  });

  test("test connection button shows success", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Configured: test-app-id")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Test Connection" }).click();

    // "Koneksi berhasil!" appears both as inline status text and toast — use .first()
    await expect(page.getByText("Koneksi berhasil!").first()).toBeVisible({ timeout: 5000 });
  });

  test("save credentials form works", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Shopee Affiliate API")).toBeVisible({ timeout: 10000 });

    // Fill new credentials
    await page.getByPlaceholder("Shopee Affiliate App ID").fill("new-app-id");
    await page.getByPlaceholder("Shopee Affiliate Secret").fill("new-secret");

    await page.getByRole("button", { name: "Update Credentials" }).click();

    await expect(page.getByText("Shopee credentials disimpan!").first()).toBeVisible({ timeout: 5000 });
  });

  test("AI key section shows not configured", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("AI Caption Enhancement")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Optional")).toBeVisible();
  });

  test("save AI key works", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("AI Caption Enhancement")).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("sk-...").fill("sk-test-key-123");
    await page.getByRole("button", { name: "Save AI Key" }).click();

    await expect(page.getByText("AI API key disimpan!").first()).toBeVisible({ timeout: 5000 });
  });

  test("change password validates empty fields", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Change Password")).toBeVisible({ timeout: 10000 });

    // Click without filling
    await page.getByRole("button", { name: "Ganti Password" }).click();

    await expect(page.getByText("Isi semua field")).toBeVisible({ timeout: 5000 });
  });

  test("change password validates short new password", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Change Password")).toBeVisible({ timeout: 10000 });

    // Password inputs on page: [0]=Shopee Secret, [1]=OpenAI Key, [2]=Current Password, [3]=New Password
    const passwordInputs = page.locator("input[type='password']");
    await passwordInputs.nth(2).fill("currentpass");
    await passwordInputs.nth(3).fill("short");
    await page.getByRole("button", { name: "Ganti Password" }).click();

    await expect(page.getByText("Password baru minimal 8 karakter")).toBeVisible({ timeout: 5000 });
  });

  test("change password success", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Change Password")).toBeVisible({ timeout: 10000 });

    // Password inputs on page: [0]=Shopee Secret, [1]=OpenAI Key, [2]=Current Password, [3]=New Password
    const passwordInputs = page.locator("input[type='password']");
    await passwordInputs.nth(2).fill("currentpass");
    await passwordInputs.nth(3).fill("newpassword123");
    await page.getByRole("button", { name: "Ganti Password" }).click();

    await expect(page.getByText("Password berhasil diganti!").first()).toBeVisible({ timeout: 5000 });
  });

  test("credentials setup instructions visible", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByText("Cara mendapatkan credentials:")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("affiliate.shopee.co.id/open_api")).toBeVisible();
  });
});
