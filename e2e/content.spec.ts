import { test, expect } from "@playwright/test";
import { mockAllAPIs } from "./helpers";

test.describe("Content Studio Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test("page renders with caption and image card sections", async ({ page }) => {
    await page.goto("/dashboard/content");

    await expect(page.getByRole("heading", { name: "Content Studio" })).toBeVisible();
    await expect(page.getByText("Caption Generator")).toBeVisible();
    await expect(page.getByText("Image Card Generator")).toBeVisible();
    await expect(page.getByText("Pilih Produk dari Link History")).toBeVisible();
  });

  test("select product from link history auto-fills fields", async ({ page }) => {
    await page.goto("/dashboard/content");

    // Open product selector — click the combobox, not the placeholder text
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "TWS Earbuds Pro Max" }).click();

    // Fields should auto-fill — product name and short link are shared state
    await expect(page.getByPlaceholder("e.g. TWS Earbuds Pro")).toHaveValue("TWS Earbuds Pro Max");
    await expect(page.getByPlaceholder("https://shope.ee/...").first()).toHaveValue("https://shope.ee/5XyZ7WqR");
  });

  test("generate caption from template works", async ({ page }) => {
    await page.goto("/dashboard/content");

    // Fill fields — use .first() since price and short link appear in both caption and image card sections
    await page.getByPlaceholder("e.g. TWS Earbuds Pro").fill("TWS Earbuds Pro Max");
    await page.getByPlaceholder("Rp 99.000").first().fill("Rp 99.000");
    await page.getByPlaceholder("5%").first().fill("8.5%");
    await page.getByPlaceholder("https://shope.ee/...").first().fill("https://shope.ee/5XyZ7WqR");

    // Generate caption
    await page.getByRole("button", { name: "Generate Caption" }).click();

    // Caption should appear in textarea
    const captionArea = page.locator("textarea[readonly]");
    await expect(captionArea).toBeVisible({ timeout: 5000 });
    const captionText = await captionArea.inputValue();
    expect(captionText).toContain("TWS Earbuds Pro Max");
    expect(captionText).toContain("https://shope.ee/5XyZ7WqR");
    expect(captionText).toContain("Rp 99.000");
  });

  test("platform change produces different caption format", async ({ page }) => {
    await page.goto("/dashboard/content");

    // Fill fields
    await page.getByPlaceholder("e.g. TWS Earbuds Pro").fill("Test Product");
    await page.getByPlaceholder("Rp 99.000").first().fill("Rp 50.000");
    await page.getByPlaceholder("https://shope.ee/...").first().fill("https://shope.ee/TEST");

    // Change platform to Telegram — Platform is the 2nd combobox (1st is link history selector)
    const platformSelect = page.locator("button[role='combobox']").nth(1);
    await platformSelect.click();
    await page.getByRole("option", { name: "Telegram" }).click();

    // Generate
    await page.getByRole("button", { name: "Generate Caption" }).click();

    const captionArea = page.locator("textarea[readonly]");
    await expect(captionArea).toBeVisible({ timeout: 5000 });
    const captionText = await captionArea.inputValue();
    expect(captionText).toContain("HOT DEAL");
  });

  test("AI enhance button calls API and shows enhanced caption", async ({ page }) => {
    await page.goto("/dashboard/content");

    // Fill and generate template caption first
    await page.getByPlaceholder("e.g. TWS Earbuds Pro").fill("TWS Earbuds Pro Max");
    await page.getByPlaceholder("Rp 99.000").first().fill("Rp 99.000");
    await page.getByPlaceholder("https://shope.ee/...").first().fill("https://shope.ee/5XyZ7WqR");
    await page.getByRole("button", { name: "Generate Caption" }).click();

    // Wait for caption
    await expect(page.locator("textarea[readonly]")).toBeVisible({ timeout: 5000 });

    // Click AI enhance
    await page.getByRole("button", { name: "Tingkatkan dengan AI" }).click();

    // Enhanced caption should appear — the label contains "AI-enhanced"
    await expect(page.getByText(/AI-enhanced/)).toBeVisible({ timeout: 10000 });
    const captionArea = page.locator("textarea[readonly]");
    const enhancedText = await captionArea.inputValue();
    expect(enhancedText).toContain("shope.ee");
  });

  test("image card preview shows when image URL and product name provided", async ({ page }) => {
    await page.goto("/dashboard/content");

    // Fill image card section — the image URL input has placeholder "https://..."
    await page.getByPlaceholder("https://...").fill("https://cf.shopee.co.id/file/test-image-1");

    // Product name field is shared — fill it
    await page.getByPlaceholder("e.g. TWS Earbuds Pro").fill("Test Product");

    // Canvas should render
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });
  });

  test("image card shows placeholder when no image URL", async ({ page }) => {
    await page.goto("/dashboard/content");

    // Should show placeholder text
    await expect(page.getByText("Isi image URL & product name untuk preview")).toBeVisible();
  });
});
