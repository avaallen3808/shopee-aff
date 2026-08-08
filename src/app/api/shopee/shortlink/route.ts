import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getShopeeCredential } from "@/lib/shopee/credential";
import { shopeeGraphQL, ShopeeAPIError, mapShopeeErrorToHttpStatus } from "@/lib/shopee/client";
import { GENERATE_SHORT_LINK_MUTATION } from "@/lib/shopee/queries";
import type { ShortLinkResult } from "@/lib/shopee/types";

const shortLinkSchema = z.object({
  originUrl: z.string().url("Invalid URL"),
  campaignId: z.string().optional(),
  subIds: z.array(z.string().max(50)).max(5).optional(),
  productInfo: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const cred = await getShopeeCredential();
  if (!cred) {
    return NextResponse.json({ error: "SHOPEE_CRED_NOT_SET" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = shortLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { originUrl, campaignId, subIds, productInfo } = parsed.data;

  try {
    const data = await shopeeGraphQL<{ generateShortLink: ShortLinkResult }>(
      cred,
      GENERATE_SHORT_LINK_MUTATION,
      {
        input: {
          originUrl,
          subIds: subIds ?? [],
        },
      }
    );

    const shortLink = data.generateShortLink.shortLink;

    // Persist Link record
    await prisma.link.create({
      data: {
        userId: session.userId,
        campaignId: campaignId ?? null,
        originUrl,
        shortLink,
        subIds: subIds ?? [],
        productInfo: (productInfo as never) ?? undefined,
      },
    });

    return NextResponse.json({ shortLink });
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
