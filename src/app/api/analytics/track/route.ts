import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Allowed event types — reject anything not on this list
const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "inflation_clock_start",
  "inflation_clock_result",
  "module_start",
  "module_section_view",
  "module_complete",
  "share_click",
  "share_generate",
  "eli5_click",
  "ai_chat_message",
  "ai_chat_start",
  "affiliate_click",
  "referral_generate",
  "referral_signup",
  "newsletter_signup",
  "language_switch",
  "premium_waitlist",
  "embed_load",
  "reaction_submit",
]);

export async function POST(req: Request) {
  // Rate limit: 60 requests per minute per IP
  const ip = getClientIp(req);
  const limited = rateLimit(`analytics:${ip}`, { maxRequests: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const sb = getSupabaseServer();
    if (!sb) {
      return NextResponse.json(
        { error: "Analytics service unavailable" },
        { status: 503 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      session_id,
      event_type,
      event_data,
      country,
      language,
      device_type,
      referral_source,
      page_path,
    } = body;

    if (typeof session_id !== "string" || !session_id || session_id.length > 100) {
      return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
    }
    if (typeof event_type !== "string" || !ALLOWED_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    // Limit event_data size to prevent database bloat
    const safeEventData = (() => {
      if (!event_data || typeof event_data !== "object") return {};
      const str = JSON.stringify(event_data);
      if (str.length <= 5000) return event_data;
      return { truncated: true };
    })();

    const { error } = await sb.from("analytics_events").insert({
      session_id,
      event_type,
      event_data: safeEventData,
      country: typeof country === "string" ? country.slice(0, 10) : null,
      language: typeof language === "string" ? language.slice(0, 5) : "en",
      device_type: typeof device_type === "string" ? device_type.slice(0, 20) : "desktop",
      referral_source: typeof referral_source === "string" ? referral_source.slice(0, 200) : null,
      page_path: typeof page_path === "string" ? page_path.slice(0, 500) : null,
    });

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json(
        { error: "Failed to store event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Analytics track error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
