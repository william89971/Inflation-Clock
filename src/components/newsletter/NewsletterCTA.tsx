"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NewsletterCTAProps {
  source: string;
  className?: string;
}

export function NewsletterCTA({ source, className = "" }: NewsletterCTAProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong"
      );
    }
  }

  return (
    <div
      className={`rounded-[20px] border border-border border-l-4 border-l-bitcoin bg-bg-card p-6 shadow-md ${className}`}
    >
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2"
          >
            <p className="text-lg font-bold text-positive">
              You&apos;re in!
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Check your inbox for a confirmation email.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="mb-4 text-sm font-semibold text-text-secondary">
              Get weekly insights on your money
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="input-warm min-w-0 flex-1 !rounded-[12px] !py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="btn-primary shrink-0 !px-5 !py-2.5 !text-sm disabled:opacity-50 disabled:hover:scale-100"
              >
                {status === "loading" ? "..." : "Subscribe"}
              </button>
            </form>
            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-negative"
              >
                {errorMessage}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
