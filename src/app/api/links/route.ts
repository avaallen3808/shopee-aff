import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(): Promise<NextResponse> {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const links = await prisma.link.findMany({
    where: { userId: session.userId },
    include: { campaign: { select: { name: true, channel: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ links });
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

  await prisma.link.deleteMany({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ success: true });
}
