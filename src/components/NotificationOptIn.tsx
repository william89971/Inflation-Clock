"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/profile";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

export function NotificationOptIn() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setSupported(true);
    if (Notification.permission === "granted") {
      setEnabled(true);
    }
  }, []);

  if (!supported) return null;

  async function handleEnable() {
    setLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Please allow notifications in your browser settings.");
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Notifications not configured.");
        setLoading(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const sessionId = getSessionId();
      const body: Record<string, unknown> = {
        session_id: sessionId,
        subscription: sub.toJSON(),
      };
      if (email.trim()) body.email = email.trim();

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setEnabled(true);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, alerts_enabled: false }),
      });
      setEnabled(false);
      setSaved(false);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-warm rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-[var(--font-heading)] text-base font-bold text-text-heading">
            🔔 Inflation Alerts
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {enabled
              ? "You'll get notified when inflation spikes or erodes your purchasing power."
              : "Get notified when inflation spikes or your purchasing power drops significantly."}
          </p>
        </div>
        <button
          onClick={enabled ? handleDisable : handleEnable}
          disabled={loading}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            enabled
              ? "bg-positive text-white hover:opacity-80"
              : "btn-primary"
          } disabled:opacity-50`}
        >
          {loading ? "..." : enabled ? "On" : "Enable"}
        </button>
      </div>

      {!enabled && !saved && (
        <div className="mt-4">
          <input
            type="email"
            placeholder="Email for backup alerts (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-warm w-full text-sm"
          />
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-negative">{error}</p>
      )}

      {saved && (
        <p className="mt-3 text-xs text-positive">
          ✓ Notifications enabled. You&apos;ll hear from us when it matters.
        </p>
      )}
    </div>
  );
}
