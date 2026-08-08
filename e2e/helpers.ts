import { SignJWT } from "jose";
import type { Page, Route } from "@playwright/test";

const AUTH_SECRET = "test-auth-secret-for-e2e-testing-only-32chars";
const COOKIE_NAME = "session";

/**
 * Generate a valid JWT session token that matches the middleware verification.
 */
export async function createTestSessionToken(
  userId = "test-user-id",
  email = "test@test.com"
): Promise<string> {
  const secret = new TextEncoder().encode(AUTH_SECRET);
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

/**
 * Set the session cookie on the browser context to bypass login.
 */
export async function setSessionCookie(page: Page): Promise<void> {
  const token = await createTestSessionToken();
  const context = page.context();
  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: token,
      domain: "localhost",
      path: "/",
    },
  ]);
}

/** Mock Shopee product offer response. */
export const MOCK_PRODUCTS = {
  nodes: [
    {
      itemId: "123456",
      productName: "TWS Earbuds Pro Max",
      productLink: "https://shopee.co.id/product-i.123.456",
      offerLink: "https://shopee.co.id/product-i.123.456",
      imageUrl: "https://cf.shopee.co.id/file/test-image-1",
      priceMin: 99000,
      priceMax: 150000,
      sales: 2500,
      ratingStar: 4.8,
      commissionRate: 8.5,
      sellerCommissionRate: 5,
      shopeeCommissionRate: 3.5,
      commission: 8500,
      shopId: "123",
      shopName: "Official Audio Store",
      shopType: 1,
    },
    {
      itemId: "789012",
      productName: "Smart Watch Sport",
      productLink: "https://shopee.co.id/product-i.789.012",
      offerLink: "https://shopee.co.id/product-i.789.012",
      imageUrl: "https://cf.shopee.co.id/file/test-image-2",
      priceMin: 150000,
      priceMax: 250000,
      sales: 500,
      ratingStar: 4.5,
      commissionRate: 4.0,
      sellerCommissionRate: 3,
      shopeeCommissionRate: 1,
      commission: 6000,
      shopId: "456",
      shopName: "Gadget Mart",
      shopType: 2,
    },
  ],
  pageInfo: { hasNextPage: false, nextPage: null },
};

/** Mock Shopee shop offer response. */
export const MOCK_SHOPS = {
  nodes: [
    {
      shopId: "123",
      shopName: "Official Audio Store",
      commissionRate: 8.5,
      ratingStar: 4.8,
      shopType: 1,
      imageUrl: "https://cf.shopee.co.id/file/test-shop-1",
      offerLink: "https://shopee.co.id/shop/123",
      remainingBudget: 500000,
      periodStartTime: 1700000000,
      periodEndTime: 1800000000,
    },
  ],
  pageInfo: { hasNextPage: false, nextPage: null },
};

/** Mock Shopee campaign offer response. */
export const MOCK_OFFERS = {
  nodes: [
    {
      commissionRate: 12.0,
      imageUrl: "https://cf.shopee.co.id/file/test-offer-1",
      offerLink: "https://shopee.co.id/promo/flash-sale",
      originalLink: "https://shopee.co.id/promo/flash-sale",
      offerName: "Flash Sale 12.12",
      offerType: "FLASH_SALE",
      periodStartTime: 1700000000,
      periodEndTime: 1800000000,
    },
  ],
  pageInfo: { hasNextPage: false, nextPage: null },
};

/** Mock conversion report response. */
export const MOCK_CONVERSIONS = {
  nodes: [
    {
      purchaseTime: Math.floor(Date.now() / 1000) - 86400,
      clickTime: Math.floor(Date.now() / 1000) - 90000,
      conversionId: "conv-001",
      totalCommission: 8500,
      sellerCommission: 5000,
      shopeeCommissionCapped: 3500,
      netCommission: 8500,
      buyerType: "NEW",
      utmContent: "instagram,stories,promo-lebaran",
      device: "APP",
      campaignType: "COMPLETED",
      orders: [
        {
          orderId: "order-001",
          items: [
            {
              itemName: "TWS Earbuds Pro Max",
              itemPrice: 99000,
              quantity: 1,
              itemTotalCommission: 8500,
              shopId: "123",
              shopName: "Official Audio Store",
              attributionType: "Ordered in Same Shop",
            },
          ],
        },
      ],
    },
  ],
  pageInfo: { hasNextPage: false, scrollId: null },
};

/** Mock validated report response. */
export const MOCK_VALIDATED = {
  nodes: [
    {
      purchaseTime: Math.floor(Date.now() / 1000) - 86400,
      conversionId: "conv-001",
      totalCommission: 8500,
      netCommission: 8500,
      orders: [],
    },
  ],
  pageInfo: { hasNextPage: false, scrollId: null },
};

/** Mock campaigns list. */
export const MOCK_CAMPAIGNS = {
  campaigns: [
    {
      id: "camp-001",
      name: "Promo Lebaran",
      channel: "instagram",
      subIds: ["instagram", "stories", "promo-lebaran"],
      linkCount: 3,
      createdAt: new Date().toISOString(),
    },
  ],
};

/** Mock links list. */
export const MOCK_LINKS = {
  links: [
    {
      id: "link-001",
      originUrl: "https://shopee.co.id/product-i.123.456",
      shortLink: "https://shope.ee/5XyZ7WqR",
      subIds: ["instagram", "stories", "promo-lebaran"],
      campaign: { name: "Promo Lebaran", channel: "instagram" },
      productInfo: {
        productName: "TWS Earbuds Pro Max",
        priceMin: 99000,
        commissionRate: 8.5,
        imageUrl: "https://cf.shopee.co.id/file/test-image-1",
        shopName: "Audio Official Store",
      },
      createdAt: new Date().toISOString(),
    },
  ],
};

/** Mock credential status. */
export const MOCK_CRED_STATUS = {
  configured: true,
  appId: "test-app-id",
  updatedAt: new Date().toISOString(),
};

/** Mock AI key status. */
export const MOCK_AI_STATUS = {
  configured: false,
  source: "none",
};

/** Mock auth status — no users yet. */
export const MOCK_AUTH_SETUP = { needsSetup: true };
export const MOCK_AUTH_NO_SETUP = { needsSetup: false };

/**
 * Intercept and mock all API calls for a page.
 * This avoids needing a real database or Shopee API credentials.
 */
export async function mockAllAPIs(page: Page): Promise<void> {
  await setSessionCookie(page);

  // Auth
  await page.route("**/api/auth/status", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_AUTH_NO_SETUP })
  );
  await page.route("**/api/auth/login", (route: Route) =>
    route.fulfill({
      status: 200,
      json: { success: true, redirect: "/dashboard" },
    })
  );
  await page.route("**/api/auth/logout", (route: Route) =>
    route.fulfill({ status: 200, json: { success: true, redirect: "/login" } })
  );

  // Shopee products
  await page.route("**/api/shopee/products**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_PRODUCTS })
  );

  // Shopee shops
  await page.route("**/api/shopee/shops**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_SHOPS })
  );

  // Shopee offers
  await page.route("**/api/shopee/offers**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_OFFERS })
  );

  // Shopee shortlink (POST)
  await page.route("**/api/shopee/shortlink", (route: Route) =>
    route.fulfill({
      status: 200,
      json: { shortLink: "https://shope.ee/5XyZ7WqR" },
    })
  );

  // Shopee test connection
  await page.route("**/api/shopee/test", (route: Route) =>
    route.fulfill({ status: 200, json: { status: "ok", message: "Connection successful" } })
  );

  // Shopee conversions
  await page.route("**/api/shopee/conversions**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_CONVERSIONS })
  );

  // Shopee validated
  await page.route("**/api/shopee/validated**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_VALIDATED })
  );

  // Content enhance
  await page.route("**/api/content/enhance", (route: Route) =>
    route.fulfill({
      status: 200,
      json: { enhanced: "🔥 WOW! TWS Earbuds Pro Max dengan harga cuma Rp 99.000!\n\nLink di bio 👆 https://shope.ee/5XyZ7WqR\n\n#shopee #affiliate" },
    })
  );

  // Campaigns
  await page.route("**/api/campaigns**", (route: Route) => {
    if (route.request().method() === "GET") {
      route.fulfill({ status: 200, json: MOCK_CAMPAIGNS });
    } else if (route.request().method() === "POST") {
      route.fulfill({
        status: 201,
        json: {
          id: "camp-new",
          name: "New Campaign",
          channel: "tiktok",
          subIds: ["tiktok", "video", "new"],
          createdAt: new Date().toISOString(),
        },
      });
    } else {
      route.fulfill({ status: 200, json: { success: true } });
    }
  });

  // Links
  await page.route("**/api/links**", (route: Route) => {
    if (route.request().method() === "GET") {
      route.fulfill({ status: 200, json: MOCK_LINKS });
    } else {
      route.fulfill({ status: 200, json: { success: true } });
    }
  });

  // Settings credentials
  await page.route("**/api/settings/credentials**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_CRED_STATUS })
  );

  // Settings AI key
  await page.route("**/api/settings/ai-key**", (route: Route) =>
    route.fulfill({ status: 200, json: MOCK_AI_STATUS })
  );

  // Settings password
  await page.route("**/api/settings/password**", (route: Route) =>
    route.fulfill({ status: 200, json: { success: true } })
  );
}
