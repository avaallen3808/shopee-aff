import { test, expect } from "@playwright/test";
import { mockAllAPIs } from "./helpers";

test.describe("Analytics & Earnings Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockAllAPIs(page);
  });

  test("analytics page loads with empty state before fetch", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    // Empty state
    await expect(page.getByText("Klik Refresh untuk fetch dari Shopee API")).toBeVisible();
  });

  test("clicking Refresh loads conversion data and shows KPIs", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    await page.getByRole("button", { name: "Refresh" }).click();

    // KPI cards should show values
    await expect(page.getByText("Total Komisi")).toBeVisible({ timeout: 10000 });
    // The mock has totalCommission 8500 — appears in multiple KPI cards, use .first()
    await expect(page.getByText("Rp 8.500").first()).toBeVisible({ timeout: 10000 });
  });

  test("analytics shows revenue chart after fetch", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    await page.getByRole("button", { name: "Refresh" }).click();

    // Revenue Trend card should appear
    await expect(page.getByText("Revenue Trend")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Total commission per hari")).toBeVisible();
  });

  test("analytics shows channel attribution after fetch", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    await page.getByRole("button", { name: "Refresh" }).click();

    await expect(page.getByText("Channel Attribution", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Channel Performance")).toBeVisible();
  });

  test("analytics date range selector works", async ({ page }) => {
    await page.goto("/dashboard/analytics");

    // Change date range — click the combobox, not the text
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "7 Hari" }).click();

    // Click refresh
    await page.getByRole("button", { name: "Refresh" }).click();

    await expect(page.getByText("Total Komisi")).toBeVisible({ timeout: 10000 });
  });

  test("earnings conversion report loads on fetch", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    // Click Fetch
    await page.getByRole("button", { name: "Fetch" }).click();

    // Conversion should appear
    await expect(page.getByText("conv-001")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Rp 8.500").first()).toBeVisible();
    await expect(page.getByText("COMPLETED")).toBeVisible();
  });

  test("earnings conversion row expands to show order items", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    await page.getByRole("button", { name: "Fetch" }).click();

    // Wait for data
    await expect(page.getByText("conv-001")).toBeVisible({ timeout: 10000 });

    // Click row to expand
    await page.getByText("conv-001").click();

    // Order items should appear
    await expect(page.getByText("TWS Earbuds Pro Max")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Official Audio Store")).toBeVisible();
  });

  test("earnings CSV export works", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    await page.getByRole("button", { name: "Fetch" }).click();

    await expect(page.getByText("conv-001")).toBeVisible({ timeout: 10000 });

    // Click Export CSV
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain("conversions");
    expect(download.suggestedFilename()).toContain(".csv");
  });

  test("earnings validated report tab works", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    // Switch to Validated Report tab
    await page.getByRole("tab", { name: "Validated Report" }).click();

    // Should show validation ID input
    await expect(page.getByPlaceholder("Masukkan validation ID")).toBeVisible();
  });

  test("earnings validated report fetches data", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    await page.getByRole("tab", { name: "Validated Report" }).click();

    await page.getByPlaceholder("Masukkan validation ID").fill("val-001");
    await page.getByRole("button", { name: "Fetch" }).click();

    // Should show validated data
    await expect(page.getByText("conv-001")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Net (validated)")).toBeVisible();
  });

  test("earnings status filter changes", async ({ page }) => {
    await page.goto("/dashboard/earnings");

    // Change status filter — Status is the 2nd combobox (1st is date range)
    const statusLabel = page.getByText("Status").first();
    const statusContainer = statusLabel.locator("..");
    await statusContainer.getByRole("combobox").click();
    await page.getByRole("option", { name: "Completed" }).click();

    await page.getByRole("button", { name: "Fetch" }).click();

    // Data should load
    await expect(page.getByText("conv-001")).toBeVisible({ timeout: 10000 });
  });
});
