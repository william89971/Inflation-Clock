import { NextRequest } from "next/server";
import webpush from "web-push";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminAuthorized } from "@/lib/admin-auth";

// Must NOT use Edge runtime — web-push is Node.js only
export const runtime = "nodejs";

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  session_ids?: string[];
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inflationclock.com";

  if (!vapidPublic || !vapidPrivate) {
    return Response.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(`mailto:admin@inflationclock.com`, vapidPublic, vapidPrivate);

  let payload: NotificationPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!payload.title || !payload.body) {
    return Response.json({ error: "title and body are required" }, { status: 400 });
  }

  const sb = getSupabaseServer();
  if (!sb) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Fetch push subscriptions
  let query = sb
    .from("user_profiles")
    .select("session_id, push_subscription")
    .eq("alerts_enabled", true)
    .not("push_subscription", "is", null);

  if (payload.session_ids?.length) {
    query = query.in("session_id", payload.session_ids);
  }

  const { data: profiles, error } = await query;
  if (error) {
    return Response.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }

  const notificationData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || `${siteUrl}/en/dashboard`,
  });

  let sent = 0;
  let failed = 0;
  const expiredSessions: string[] = [];

  await Promise.all(
    (profiles ?? []).map(async (profile) => {
      try {
        await webpush.sendNotification(
          profile.push_subscription as webpush.PushSubscription,
          notificationData
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired — queue for cleanup
          expiredSessions.push(profile.session_id);
        }
        failed++;
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredSessions.length > 0) {
    await sb
      .from("user_profiles")
      .update({ push_subscription: null, alerts_enabled: false })
      .in("session_id", expiredSessions);
  }

  return Response.json({ sent, failed });
}
