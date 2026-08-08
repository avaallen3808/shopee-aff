import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "session";
const PROTECTED_PATHS = ["/dashboard", "/api/shopee", "/api/content", "/api/campaigns", "/api/links", "/api/settings"];
const PUBLIC_PATHS = ["/login", "/api/auth"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const valid = await verifyToken(token);
  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "INVALID_SESSION" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/shopee/:path*",
    "/api/content/:path*",
    "/api/campaigns/:path*",
    "/api/settings/:path*",
  ],
};

// Suppress unused warning for isPublic — kept for potential future allowlist
void isPublic;
