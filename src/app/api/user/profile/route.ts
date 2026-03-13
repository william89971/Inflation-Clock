import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`profile:${ip}`, { maxRequests: 30, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId || sessionId.length > 100) {
    return Response.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await sb
    .from("user_profiles")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found (not an error)
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ profile: data || null });
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`profile:${ip}`, { maxRequests: 20, windowMs: 60_000 });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sessionId = body.session_id as string;
  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return Response.json({ error: "Invalid session_id" }, { status: 400 });
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Handle fetch-via-POST (avoids session_id in URL query params)
  if (body._action === "fetch") {
    const { data, error } = await sb
      .from("user_profiles")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (error && error.code !== "PGRST116") {
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    return Response.json({ profile: data || null });
  }

  // Field type validation schema
  const fieldValidators: Record<string, (v: unknown) => boolean> = {
    // String fields (max 200 chars)
    country: (v) => typeof v === "string" && v.length <= 200,
    country_code: (v) => typeof v === "string" && v.length <= 10,
    region: (v) => typeof v === "string" && v.length <= 200,
    city: (v) => typeof v === "string" && v.length <= 200,
    currency: (v) => typeof v === "string" && v.length <= 10,
    language: (v) => typeof v === "string" && v.length <= 10,
    device_type: (v) => typeof v === "string" && v.length <= 50,
    referral_code: (v) => typeof v === "string" && v.length <= 50,
    alert_email: (v) => typeof v === "string" && v.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v as string),
    alert_frequency: (v) => typeof v === "string" && ["daily", "weekly", "monthly"].includes(v as string),
    expenses_updated_at: (v) => typeof v === "string" && !isNaN(Date.parse(v as string)),
    last_visit: (v) => typeof v === "string" && !isNaN(Date.parse(v as string)),
    // Number fields (non-negative, reasonable bounds)
    birth_year: (v) => typeof v === "number" && Number.isFinite(v) && v >= 1900 && v <= 2030,
    age: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 150,
    monthly_income: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_rent: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_groceries: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_transport: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_utilities: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_healthcare: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_education: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    monthly_other: (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1e9,
    lifetime_loss: (v) => typeof v === "number" && Number.isFinite(v),
    daily_loss: (v) => typeof v === "number" && Number.isFinite(v),
    monthly_loss: (v) => typeof v === "number" && Number.isFinite(v),
    yearly_loss: (v) => typeof v === "number" && Number.isFinite(v),
    btc_comparison: (v) => typeof v === "number" && Number.isFinite(v),
    last_inflation_rate: (v) => typeof v === "number" && Number.isFinite(v),
    visit_count: (v) => typeof v === "number" && Number.isInteger(v) && v >= 0,
    total_chat_messages: (v) => typeof v === "number" && Number.isInteger(v) && v >= 0,
    // Boolean fields
    alerts_enabled: (v) => typeof v === "boolean",
    // Array/object fields
    family_members: (v) => Array.isArray(v) && v.length <= 10,
    modules_completed: (v) => Array.isArray(v) && v.length <= 100,
  };

  const profileData: Record<string, unknown> = {
    session_id: sessionId,
    updated_at: new Date().toISOString(),
  };

  for (const [field, validate] of Object.entries(fieldValidators)) {
    if (body[field] !== undefined) {
      if (!validate(body[field])) {
        return Response.json({ error: `Invalid value for field: ${field}` }, { status: 400 });
      }
      profileData[field] = body[field];
    }
  }

  // Upsert: create if not exists, update if exists
  const { data, error } = await sb
    .from("user_profiles")
    .upsert(profileData, { onConflict: "session_id" })
    .select()
    .single();

  if (error) {
    // Log error code only — avoid leaking full error details in production
    console.error("Profile upsert error:", error.code, error.message);
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return Response.json({ profile: data });
}
