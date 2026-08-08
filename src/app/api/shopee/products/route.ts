import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getShopeeCredential } from "@/lib/shopee/credential";
import { shopeeGraphQL, ShopeeAPIError, mapShopeeErrorToHttpStatus } from "@/lib/shopee/client";
import { PRODUCT_OFFER_V2_QUERY } from "@/lib/shopee/queries";
import type { ProductOfferResponse } from "@/lib/shopee/types";

const productSchema = z.object({
  keyword: z.string().optional(),
  shopId: z.string().optional(),
  itemId: z.string().optional(),
  productCatId: z.string().optional(),
  listType: z.coerce.number().optional(),
  sortType: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  isAMSOffer: z.coerce.boolean().optional(),
  isKeySeller: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cred = await getShopeeCredential();
  if (!cred) {
    return NextResponse.json({ error: "SHOPEE_CRED_NOT_SET" }, { status: 400 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = productSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await shopeeGraphQL<ProductOfferResponse>(
      cred,
      PRODUCT_OFFER_V2_QUERY,
      parsed.data
    );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    if (err instanceof ShopeeAPIError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: mapShopeeErrorToHttpStatus(err.code) }
      );
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
