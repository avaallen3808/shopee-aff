import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

const credentialSchema = z.object({
  appId: z.string().min(1, "AppId required"),
  secret: z.string().min(1, "Secret required"),
});

export async function GET(): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const cred = await prisma.shopeeCredential.findUnique({
    where: { userId: session.userId },
    select: { appId: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({
    configured: !!cred,
    appId: cred?.appId ?? null,
    updatedAt: cred?.updatedAt ?? null,
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

  const parsed = credentialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const encryptedSecret = encrypt(parsed.data.secret);

  await prisma.shopeeCredential.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      appId: parsed.data.appId,
      secret: encryptedSecret,
    },
    update: {
      appId: parsed.data.appId,
      secret: encryptedSecret,
    },
  });

  return NextResponse.json({ success: true });
}
