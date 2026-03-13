import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`waitlist:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const sb = getSupabaseServer();
    if (!sb) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { email, interested_features } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Upsert to avoid duplicates — update features if email already exists
    const { error } = await sb.from("premium_waitlist").upsert(
      {
        email,
        interested_features: interested_features || [],
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("Premium waitlist insert error:", error);
      return NextResponse.json(
        { error: "Failed to join waitlist" },
        { status: 500 }
      );
    }

    // Return updated count
    const { count } = await sb
      .from("premium_waitlist")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ success: true, count: count || 0 });
  } catch (err) {
    console.error("Premium waitlist error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sb = getSupabaseServer();
    if (!sb) {
      return NextResponse.json({ count: 0 });
    }

    const { count } = await sb
      .from("premium_waitlist")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ count: count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
