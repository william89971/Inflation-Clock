"use client";

// ── Supported event types ──────────────────────────────────────────────
export type AnalyticsEvent =
  | "page_view"
  | "inflation_clock_start"
  | "inflation_clock_result"
  | "share_click"
  | "share_generate"
  | "module_start"
  | "module_section_view"
  | "module_complete"
  | "eli5_click"
  | "ai_chat_message"
  | "ai_chat_start"
  | "affiliate_click"
  | "referral_generate"
  | "referral_signup"
  | "newsletter_signup"
  | "language_switch"
  | "premium_waitlist"
  | "embed_load"
  | "reaction_submit";

// ── Session ID (mirrors pattern from progress.ts) ──────────────────────
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("session_id", id);
  }
  return id;
}

// ── Device type detection ──────────────────────────────────────────────
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile/i.test(
      ua
    )
  )
    return "mobile";
  return "desktop";
}

// ── Referral source from URL params ────────────────────────────────────
function getReferralSource(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("utm_source") || params.get("ref") || null;
}

// ── Country from stored user data ──────────────────────────────────────
function getCountry(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user_data");
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data.country || null;
  } catch {
    return null;
  }
}

// ── Language from document ─────────────────────────────────────────────
function getLanguage(): string {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang || "en";
}

// ── Main tracking function ─────────────────────────────────────────────
/**
 * Fire-and-forget event tracking.
 * Non-blocking — don't await in calling code.
 *
 * Usage:
 *   trackEvent("page_view", { path: "/learn" });
 *   trackEvent("affiliate_click", { partner: "strike" });
 */
export async function trackEvent(
  eventType: AnalyticsEvent | string,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const payload = {
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData || {},
      country: getCountry(),
      language: getLanguage(),
      device_type: getDeviceType(),
      referral_source: getReferralSource(),
      page_path: typeof window !== "undefined" ? window.location.pathname : "",
    };

    // Non-blocking POST — intentionally not awaited by callers
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Use keepalive so the request survives page navigation
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics should never break the app
    });
  } catch {
    // Silently fail
  }
}
