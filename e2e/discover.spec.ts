import { test, expect } from "@playwright/test";
import { mockAllAPIs, MOCK_PRODUCTS } from "./helpers";

test.describe("Discover Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test("search products and display results", async ({ page }) => {
    await page.goto("/dashboard/discover");

    // Fill keyword and search
    await page.getByPlaceholder("Cari produk atau shop...").fill("earbuds");
    await page.getByRole("button", { name: "Cari" }).click();

    // Wait for product cards to appear
    await expect(page.getByText("TWS Earbuds Pro Max")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Smart Watch Sport")).toBeVisible();

    // Verify commission badge
    await expect(page.getByText("8.5%").first()).toBeVisible();

    // Verify High Profit badge (commission > 5%)
    await expect(page.getByText("High Profit")).toBeVisible();

    // Verify Trending badge (sales > 1000)
    await expect(page.getByText(/2.5rb terjual/)).toBeVisible();
  });

  test("shop type filter change works", async ({ page }) => {
    await page.goto("/dashboard/discover");

    // Change shop type to Mall — click the select trigger next to "Shop Type" label
    const shopTypeLabel = page.getByText("Shop Type").first();
    const shopTypeContainer = shopTypeLabel.locator("..");
    await shopTypeContainer.getByRole("combobox").click();
    await page.getByRole("option", { name: "Mall" }).click();

    await page.getByPlaceholder("Cari produk atau shop...").fill("audio");
    await page.getByRole("button", { name: "Cari" }).click();

    // Products should appear
    await expect(page.getByText("TWS Earbuds Pro Max")).toBeVisible({ timeout: 10000 });
  });

  test("switch to Shops tab and see results", async ({ page }) => {
    await page.goto("/dashboard/discover");

    // Click Shops tab
    await page.getByRole("tab", { name: "Shops" }).click();

    // Wait for shop results
    await expect(page.getByText("Official Audio Store")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Mall")).toBeVisible();
  });

  test("switch to Shopee Offers tab and see results", async ({ page }) => {
    await page.goto("/dashboard/discover");

    // Click Shopee Offers tab
    await page.getByRole("tab", { name: "Shopee Offers" }).click();

    // Wait for offer results
    await expect(page.getByText("Flash Sale 12.12")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("FLASH_SALE")).toBeVisible();
  });

  test("Buat Link modal opens and generates short link", async ({ page }) => {
    await page.goto("/dashboard/discover");

    // Search products
    await page.getByPlaceholder("Cari produk atau shop...").fill("earbuds");
    await page.getByRole("button", { name: "Cari" }).click();

    // Wait for products and click Buat Link
    await expect(page.getByText("TWS Earbuds Pro Max")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Buat Link" }).first().click();

    // Modal should open
    await expect(page.getByText("Buat Short Link")).toBeVisible();

    // Select a campaign — click the combobox trigger, not the label
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /Promo Lebaran/ }).click();

    // Generate
    await page.getByRole("button", { name: "Generate" }).click();

    // Short link result should appear with the URL
    await expect(page.getByText("shope.ee")).toBeVisible({ timeout: 10000 });
  });

  test("empty state shows when no results", async ({ page }) => {
    // Override mock to return empty
    await page.route("**/api/shopee/products**", (route) =>
      route.fulfill({ status: 200, json: { nodes: [], pageInfo: { hasNextPage: false, nextPage: null } } })
    );

    await page.goto("/dashboard/discover");
    await page.getByPlaceholder("Cari produk atau shop...").fill("nonexistent");
    await page.getByRole("button", { name: "Cari" }).click();

    await expect(page.getByText("Ketik keyword dan klik Cari")).toBeVisible({ timeout: 10000 });
  });

  test("credential error shows appropriate message", async ({ page }) => {
    // Override products to return credential error
    await page.route("**/api/shopee/products**", (route) =>
      route.fulfill({ status: 400, json: { error: "SHOPEE_CRED_NOT_SET" } })
    );

    await page.goto("/dashboard/discover");
    await page.getByPlaceholder("Cari produk atau shop...").fill("test");
    await page.getByRole("button", { name: "Cari" }).click();

    await expect(page.getByText("Set Shopee API credentials di Settings dulu")).toBeVisible({ timeout: 10000 });
  });
});
