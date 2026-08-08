import { NextResponse } from "next/server";
import { getShopeeCredential } from "@/lib/shopee/credential";
import { shopeeGraphQL, ShopeeAPIError, mapShopeeErrorToHttpStatus } from "@/lib/shopee/client";
import { SHOPEE_OFFER_V2_QUERY } from "@/lib/shopee/queries";
import type { ShopeeOfferResponse } from "@/lib/shopee/types";

export async function GET(): Promise<NextResponse> {
  const cred = await getShopeeCredential();
  if (!cred) {
    return NextResponse.json({ error: "SHOPEE_CRED_NOT_SET" }, { status: 400 });
  }

  try {
    await shopeeGraphQL<ShopeeOfferResponse>(
      cred,
      SHOPEE_OFFER_V2_QUERY,
      { limit: 1 }
    );
    return NextResponse.json({ status: "ok", message: "Connection successful" });
  } catch (err) {
    if (err instanceof ShopeeAPIError) {
      return NextResponse.json(
        { error: err.message, code: err.code, status: "error" },
        { status: mapShopeeErrorToHttpStatus(err.code) }
      );
    }
    return NextResponse.json(
      { error: "CONNECTION_FAILED", status: "error" },
      { status: 502 }
    );
  }
}
