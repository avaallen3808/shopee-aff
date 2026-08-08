import { test, expect } from "@playwright/test";
import { mockAllAPIs } from "./helpers";

test.describe("Page Rendering — all dashboard pages load without errors", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test("dashboard overview renders", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("META Strategy Tips")).toBeVisible();
    // Quick action cards — use role links to be specific
    await expect(page.getByRole("link", { name: /Cari Produk/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Buat Link/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Content Studio", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Analytics", exact: true })).toBeVisible();
  });

  test("discover page renders with 3 tabs", async ({ page }) => {
    await page.goto("/dashboard/discover");

    await expect(page.getByRole("heading", { name: "Discover" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Products" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Shops" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Shopee Offers" })).toBeVisible();
  });

  test("links page renders", async ({ page }) => {
    await page.goto("/dashboard/links");

    await expect(page.getByRole("heading", { name: "Links & Campaigns" })).toBeVisible();
    await expect(page.getByText("Campaigns").first()).toBeVisible();
    await expect(page.getByText("Link Generator")).toBeVisible();
    await expect(page.getByText("Link History")).toBeVisible();
  });

  test("content studio renders", async ({ page }) => {
    await page.goto("/dashboard/content");

    await expect(page.getByRole("heading", { name: "Content Studio" })).toBeVisible();
    await expect(page.getByText("Caption Generator")).toBeVisible();
    await expect(page.getByText("Image Card Generator")).toBeVisible();
  });

  test("analytics page renders", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Total Komisi")).toBeVisible();
    await expect(page.getByText("Total Konversi")).toBeVisible();
  });

  test("earnings page renders with 2 tabs", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    await expect(page.getByRole("heading", { name: "Earnings" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Conversion Report" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Validated Report" })).toBeVisible();
  });

  test("settings page renders with 3 sections", async ({ page }) => {
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Shopee Affiliate API")).toBeVisible();
    await expect(page.getByText("AI Caption Enhancement")).toBeVisible();
    await expect(page.getByText("Change Password")).toBeVisible();
  });

  test("sidebar navigation works between all pages", async ({ page }) => {
    await page.goto("/dashboard");

    // Navigate to Discover
    await page.getByRole("link", { name: "Discover" }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/discover/);

    // Navigate to Links
    await page.getByRole("link", { name: "Links & Campaigns" }).click();
    await expect(page).toHaveURL(/\/dashboard\/links/);

    // Navigate to Settings
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
  });
});
