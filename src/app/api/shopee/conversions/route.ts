import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getShopeeCredential } from "@/lib/shopee/credential";
import { shopeeGraphQL, ShopeeAPIError, mapShopeeErrorToHttpStatus } from "@/lib/shopee/client";
import { CONVERSION_REPORT_QUERY } from "@/lib/shopee/queries";
import type { ConversionReportResponse } from "@/lib/shopee/types";

const conversionSchema = z.object({
  purchaseTimeStart: z.coerce.number().optional(),
  purchaseTimeEnd: z.coerce.number().optional(),
  orderStatus: z.string().optional(),
  buyerType: z.string().optional(),
  device: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  scrollId: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cred = await getShopeeCredential();
  if (!cred) {
    return NextResponse.json({ error: "SHOPEE_CRED_NOT_SET" }, { status: 400 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = conversionSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await shopeeGraphQL<ConversionReportResponse>(
      cred,
      CONVERSION_REPORT_QUERY,
      parsed.data
    );
    return NextResponse.json(data);
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
