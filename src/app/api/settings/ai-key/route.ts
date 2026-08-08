import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

const aiKeySchema = z.object({
  apiKey: z.string().min(1, "API key required"),
});

export async function GET(): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { aiApiKey: true },
  });

  const hasEnvKey = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    configured: !!user?.aiApiKey || hasEnvKey,
    source: hasEnvKey ? "env" : user?.aiApiKey ? "db" : "none",
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

  const parsed = aiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const encryptedKey = encrypt(parsed.data.apiKey);

  await prisma.user.update({
    where: { id: session.userId },
    data: { aiApiKey: encryptedKey },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { aiApiKey: null },
  });

  return NextResponse.json({ success: true });
}
