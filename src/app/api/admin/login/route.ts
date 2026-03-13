import { NextRequest, NextResponse } from "next/server";
import { safeCompare, createAdminSession, revokeAdminSession } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 15 minutes per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`admin-login:${ip}`, { maxRequests: 5, windowMs: 15 * 60_000 });
  if (limited) return limited;

  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || !password || !safeCompare(password, adminPassword)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const sessionToken = createAdminSession();
    const response = NextResponse.json({ success: true });

    // Set HttpOnly, Secure, SameSite cookie — inaccessible to JavaScript
    response.cookies.set("admin_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) revokeAdminSession(cookieToken);

  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_token");
  return response;
}
