"use client";

import { useState } from "react";
import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";

interface ShareButtonsProps {
  lifetimeLoss: number;
  dailyLoss: number;
  country: CountryCode;
  age: number;
  shareUrl?: string;
}

export function ShareButtons({
  lifetimeLoss,
  dailyLoss,
  country,
  age,
  shareUrl,
}: ShareButtonsProps) {
  const t = useI18n();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formattedLoss = formatCurrency(lifetimeLoss, country);

  const baseUrl =
    shareUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "https://inflationclock.com");

  const utmUrl = `${baseUrl}?utm_source=share&utm_medium=social&utm_campaign=results`;

  const shareText = t("share.tweetText");

  function handleTwitter() {
    trackEvent("share_click", { platform: "twitter", content_type: "results" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(utmUrl)}`;
    window.open(url, "_blank");
  }

  function handleWhatsApp() {
    trackEvent("share_click", {
      platform: "whatsapp",
      content_type: "results",
    });
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${utmUrl}`)}`;
    window.open(url, "_blank");
  }

  function handleTelegram() {
    trackEvent("share_click", {
      platform: "telegram",
      content_type: "results",
    });
    const url = `https://t.me/share/url?url=${encodeURIComponent(utmUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  }

  function handleCopyLink() {
    trackEvent("share_click", {
      platform: "copy_link",
      content_type: "results",
    });
    navigator.clipboard.writeText(utmUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleNostr() {
    trackEvent("share_click", { platform: "nostr", content_type: "results" });
    const noteText = `${shareText}\n\n${utmUrl}`;
    const nostrUrl = `nostr:note?content=${encodeURIComponent(noteText)}`;
    window.open(nostrUrl, "_blank");
  }

  async function handleDownload() {
    trackEvent("share_click", {
      platform: "download",
      content_type: "results",
    });
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        country,
        lifetimeLoss: lifetimeLoss.toString(),
        dailyLoss: dailyLoss.toString(),
        age: age.toString(),
        story: "true",
      });
      const res = await fetch(`/api/og-image/results?${params.toString()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inflation-clock-${country}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  const buttonBase =
    "flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 font-[var(--font-heading)] font-semibold text-white transition-all w-full sm:w-auto hover:shadow-md";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="card-warm mx-auto w-full max-w-4xl p-8 text-center"
    >
      <h2 className="mb-6 font-[var(--font-heading)] text-xl font-bold text-primary">{t("share.title")}</h2>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {/* Twitter/X */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTwitter}
          className={`${buttonBase} bg-[#1DA1F2] hover:bg-[#1a8cd8]`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {t("share.twitter")}
        </motion.button>

        {/* WhatsApp */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleWhatsApp}
          className={`${buttonBase} bg-[#25D366] hover:bg-[#20bd5a]`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t("share.whatsapp")}
        </motion.button>

        {/* Telegram */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleTelegram}
          className={`${buttonBase} bg-[#0088cc] hover:bg-[#0077b3]`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          {t("share.telegram")}
        </motion.button>

        {/* Copy Link */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyLink}
          className={`${buttonBase} border-2 border-border bg-white !text-text-primary hover:bg-bg-card-hover`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {copied ? t("share.copied") : t("share.copy")}
        </motion.button>

        {/* Nostr */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNostr}
          className={`${buttonBase} bg-[#8B5CF6] hover:bg-[#7c3aed]`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 14.5c-1.5 1-3.5 1.5-5 .5s-2-3-1-4.5 3-2 4.5-1.5 2.5 2.5 2 4c-.2.6-.5 1-1 1.5h-.5z" />
          </svg>
          {t("share.nostr")}
        </motion.button>

        {/* Download Image */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          disabled={downloading}
          className={`${buttonBase} border border-bitcoin/30 bg-bitcoin/5 text-bitcoin hover:bg-bitcoin/10 disabled:opacity-50`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {downloading ? "..." : t("share.download")}
        </motion.button>
      </div>
    </motion.div>
  );
}
