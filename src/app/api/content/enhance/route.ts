import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

const enhanceSchema = z.object({
  caption: z.string().min(1).max(2000),
  platform: z.enum(["instagram", "tiktok", "telegram", "whatsapp"]),
  tone: z.enum(["casual", "persuasive", "educational", "urgent"]),
  productInfo: z
    .object({
      productName: z.string().optional(),
      price: z.string().optional(),
    })
    .optional(),
});

const SYSTEM_PROMPT =
  "Tingkatkan caption affiliate Shopee berikut menjadi lebih engaging untuk {platform}, tone {tone}. " +
  "Pertahankan link affiliate. Maksimal 150 kata. Gunakan emoji secukupnya. Bahasa Indonesia.";

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

  const parsed = enhanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get AI API key — check env first, then user record
  let apiKey = process.env.OPENAI_API_KEY ?? "";
  if (!apiKey) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { aiApiKey: true },
    });
    if (user?.aiApiKey) {
      try {
        apiKey = decrypt(user.aiApiKey);
      } catch {
        apiKey = "";
      }
    }
  }

  if (!apiKey) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 400 });
  }

  const { caption, platform, tone, productInfo } = parsed.data;
  const systemPrompt = SYSTEM_PROMPT.replace("{platform}", platform).replace(
    "{tone}",
    tone
  );

  const userMessage = productInfo
    ? `Produk: ${productInfo.productName ?? "-"}, Harga: ${productInfo.price ?? "-"}\n\nCaption asli:\n${caption}`
    : `Caption asli:\n${caption}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "AI_REQUEST_FAILED", details: errText },
        { status: 502 }
      );
    }

    const data: { choices: { message: { content: string } }[] } =
      await res.json();
    const enhanced = data.choices[0]?.message?.content ?? caption;

    return NextResponse.json({ enhanced });
  } catch {
    return NextResponse.json(
      { error: "AI_REQUEST_FAILED" },
      { status: 502 }
    );
  }
}
