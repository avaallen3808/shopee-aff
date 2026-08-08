import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const campaignSchema = z.object({
  name: z.string().min(1, "Name required").max(100),
  channel: z.enum([
    "instagram",
    "tiktok",
    "telegram",
    "whatsapp",
    "facebook",
    "youtube",
    "other",
  ]),
  subIds: z.array(z.string().max(50)).max(5).default([]),
});

export async function GET(): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.userId },
    include: { links: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      subIds: c.subIds,
      linkCount: c.links.length,
      createdAt: c.createdAt,
    })),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.userId,
      name: parsed.data.name,
      channel: parsed.data.channel,
      subIds: parsed.data.subIds,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
  }

  await prisma.campaign.deleteMany({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ success: true });
}
