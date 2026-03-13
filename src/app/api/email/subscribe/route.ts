import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`subscribe:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const sb = getSupabaseServer();
    if (!sb) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { email, country, language, source } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await sb
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json({ success: true, already_subscribed: true });
      }

      // Re-subscribe: set is_active back to true
      await sb
        .from("newsletter_subscribers")
        .update({
          is_active: true,
          unsubscribed_at: null,
          country: country || null,
          language: language || "en",
          source: source || "website",
        })
        .eq("id", existing.id);

      return NextResponse.json({ success: true, resubscribed: true });
    }

    // Insert new subscriber
    const { error } = await sb.from("newsletter_subscribers").insert({
      email: email.toLowerCase().trim(),
      country: country || null,
      language: language || "en",
      source: source || "website",
      is_active: true,
    });

    if (error) {
      console.error("Newsletter subscribe error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
