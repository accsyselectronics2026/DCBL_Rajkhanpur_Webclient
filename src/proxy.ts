import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// pages and APIs anyone can open
const PUBLIC_EXACT = ["/login", "/forgot-password", "/reset-password", "/api/auth/login"];

// old PHP endpoints called by the external counter app (no login, same as before)
const PUBLIC_PREFIX = ["/Api/"];

async function isLoggedIn(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const loggedIn = await isLoggedIn(req);

  if (PUBLIC_EXACT.includes(pathname)) {
    // already signed in? skip the login page
    if (loggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/reports", req.url));
    }
    return NextResponse.next();
  }

  if (loggedIn) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};