import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword, setSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const userCount = await prisma.user.count();

  // Bootstrap: create first admin if no users exist
  if (userCount === 0) {
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      const ok = await verifyPassword(password, existing.passwordHash);
      if (!ok) {
        return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
      }
      await setSessionCookie(existing.id, existing.email);
      return NextResponse.json({ success: true, redirect: "/dashboard" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });
    await setSessionCookie(user.id, user.email);
    return NextResponse.json({ success: true, redirect: "/dashboard" });
  }

  // Normal login
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  await setSessionCookie(user.id, user.email);
  return NextResponse.json({ success: true, redirect: "/dashboard" });
}
