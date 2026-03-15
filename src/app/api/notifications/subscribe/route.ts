import { getSupabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limited = rateLimit(`notify-sub:${ip}`, { maxRequests: 5, windowMs: 60_000 });
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

  const subscription = body.subscription as PushSubscriptionPayload;
  if (
    !subscription ||
    typeof subscription.endpoint !== "string" ||
    !subscription.keys?.p256dh ||
    !subscription.keys?.auth
  ) {
    return Response.json({ error: "Invalid subscription object" }, { status: 400 });
  }

  const email = body.email as string | undefined;
  if (email !== undefined) {
    if (typeof email !== "string" || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  const profileData: Record<string, unknown> = {
    session_id: sessionId,
    push_subscription: subscription,
    alerts_enabled: true,
    updated_at: new Date().toISOString(),
  };
  if (email) {
    profileData.alert_email = email;
  }

  const { error } = await sb
    .from("user_profiles")
    .upsert(profileData, { onConflict: "session_id" });

  if (error) {
    console.error("Push subscribe error:", error.code, error.message);
    return Response.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
