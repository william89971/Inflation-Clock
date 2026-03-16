"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { getRecommendedPartners, AffiliatePartner } from "@/config/affiliates";
import { trackEvent } from "@/lib/analytics";

interface SmartRecommendationProps {
  country: string;
  modulesCompleted: number;
}

export function SmartRecommendation({
  country,
  modulesCompleted,
}: SmartRecommendationProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const recommended = getRecommendedPartners(
      country,
      modulesCompleted,
      isMobile
    );
    setPartners(recommended.slice(0, 4));
  }, [country, modulesCompleted]);

  async function handleClick(partner: AffiliatePartner) {
    trackEvent("affiliate_click", {
      partner_id: partner.id,
      partner_name: partner.name,
      country,
    });

    try {
      const sessionId = localStorage.getItem("session_id") || "";
      const res = await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          partner_id: partner.id,
          country,
        }),
      });
      const data = await res.json();
      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      window.open(
        `${partner.affiliateBaseUrl}?${partner.affiliateParam}=inflationclock`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  }

  if (partners.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-4xl"
    >
      <h2 className="mb-2 text-center font-[var(--font-heading)] text-xl font-bold text-primary">
        {t("recommend.title")}
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {partners.map((partner, i) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            className="card-warm group relative p-6"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl">{partner.logo}</span>
              <div className="flex-1">
                <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary">{partner.name}</h3>
              </div>
              {/* Why we recommend tooltip */}
              {partner.whyRecommend && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setTooltipOpen(
                        tooltipOpen === partner.id ? null : partner.id
                      )
                    }
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-text-muted transition-colors hover:border-bitcoin hover:text-bitcoin"
                    aria-label={t("recommend.why")}
                  >
                    ?
                  </button>
                  {tooltipOpen === partner.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="tooltip-warm absolute right-0 z-10 mt-2 w-56 shadow-lg"
                    >
                      <p className="mb-1 font-semibold text-bitcoin">
                        {t("recommend.why")}
                      </p>
                      <p>
                        {locale === "es"
                          ? (partner.whyRecommend?.es ?? partner.description.es)
                          : (partner.whyRecommend?.en ?? partner.description.en)}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <p className="mb-4 text-sm text-text-secondary">
              {locale === "es"
                ? partner.description.es
                : partner.description.en}
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(partner)}
              className="btn-primary w-full !py-3"
            >
              {t("recommend.cta")}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
