import { test, expect } from "@playwright/test";
import { mockAllAPIs } from "./helpers";

test.describe("Links & Campaigns Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test("existing campaigns load in sidebar", async ({ page }) => {
    await page.goto("/dashboard/links");

    await expect(page.getByText("Promo Lebaran")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Instagram").first()).toBeVisible();
    await expect(page.getByText("3 links")).toBeVisible();
  });

  test("create new campaign via dialog", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Wait for campaigns to load first
    await expect(page.getByText("Promo Lebaran")).toBeVisible({ timeout: 10000 });

    // Click + button to open campaign dialog — it's in the Campaigns card header next to the title
    const cardHeader = page.getByText("Track per channel").locator("xpath=../..");
    await cardHeader.getByRole("button").click();

    await expect(page.getByRole("heading", { name: "Campaign Baru" })).toBeVisible();

    // Fill form — Label has no htmlFor, use placeholder
    await page.getByPlaceholder("e.g. Promo Lebaran").fill("Test Campaign");

    // Click the Channel combobox (inside the dialog)
    await page.getByRole("dialog").getByRole("combobox").click();
    await page.getByRole("option", { name: "TikTok" }).click();

    await page.getByPlaceholder("e.g. instagram,stories,promo-lebaran").fill("tiktok,video,test");

    await page.getByRole("button", { name: "Buat" }).click();

    // Toast success
    await expect(page.getByText("Campaign dibuat!")).toBeVisible({ timeout: 5000 });
  });

  test("single link generation works", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Wait for campaigns to load
    await expect(page.getByText("Promo Lebaran")).toBeVisible({ timeout: 10000 });

    // Select campaign — click the combobox next to "Campaign (opsional)" label
    const campaignLabel = page.getByText("Campaign (opsional)");
    const campaignContainer = campaignLabel.locator("..");
    await campaignContainer.getByRole("combobox").click();
    await page.getByRole("option", { name: /Promo Lebaran/ }).click();

    // Enter URL
    await page.getByPlaceholder("https://shopee.co.id/product-i.123.456").fill(
      "https://shopee.co.id/product-i.123.456"
    );

    // Generate
    await page.getByRole("button", { name: "Generate Link" }).click();

    // Short link should appear in the generated result area (not the link history)
    await expect(page.getByRole("button", { name: "Salin" })).toBeVisible({ timeout: 10000 });
  });

  test("bulk link generation shows results", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Switch to Bulk tab
    await page.getByRole("tab", { name: "Bulk" }).click();

    // Enter multiple URLs
    await page.getByPlaceholder(/https:\/\/shopee.co.id\/product/).fill(
      "https://shopee.co.id/product-i.123.456\nhttps://shopee.co.id/product-i.789.012"
    );

    // Generate
    await page.getByRole("button", { name: "Generate Bulk" }).click();

    // Results should show
    await expect(page.getByText("shope.ee").first()).toBeVisible({ timeout: 10000 });
  });

  test("link history displays saved links", async ({ page }) => {
    await page.goto("/dashboard/links");

    await expect(page.getByText("Link History")).toBeVisible();
    await expect(page.getByText("https://shope.ee/5XyZ7WqR")).toBeVisible({ timeout: 10000 });
    // Instagram badge appears in link history
    await expect(page.getByText("Instagram").first()).toBeVisible();
  });

  test("copy link button works", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/dashboard/links");

    // Wait for links to load
    await expect(page.getByText("https://shope.ee/5XyZ7WqR")).toBeVisible({ timeout: 10000 });

    // Click copy button — find the link row containing this short link, then its first button
    const shortLink = page.getByText("https://shope.ee/5XyZ7WqR").first();
    const linkRow = shortLink.locator("xpath=ancestor::div[contains(@class,'rounded-md') and contains(@class,'border')]");
    await linkRow.getByRole("button").first().click();

    // Toast should show
    await expect(page.getByText("Disalin!")).toBeVisible({ timeout: 5000 });
  });

  test("delete campaign works", async ({ page }) => {
    await page.goto("/dashboard/links");

    // Wait for campaign to load
    await expect(page.getByText("Promo Lebaran")).toBeVisible({ timeout: 10000 });

    // Click delete — the trash icon button in the campaign row (bordered div)
    const campaignName = page.getByText("Promo Lebaran").first();
    const campaignRow = campaignName.locator("xpath=ancestor::div[contains(@class,'rounded-md') and contains(@class,'border')]");
    await campaignRow.getByRole("button").click();

    await expect(page.getByText("Campaign dihapus")).toBeVisible({ timeout: 5000 });
  });
});
