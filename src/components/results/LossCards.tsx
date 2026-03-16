"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/calculations";
import { CountryCode } from "@/data/inflation";

interface LossCardsProps {
  dailyLoss: number;
  monthlyLoss: number;
  yearlyLoss: number;
  country: CountryCode;
}

export function LossCards({
  dailyLoss,
  monthlyLoss,
  yearlyLoss,
  country,
}: LossCardsProps) {
  const t = useI18n();

  const cards = [
    { icon: "\u23F1\uFE0F", label: t("loss.daily"), value: dailyLoss, sublabel: t("loss.daily.sublabel") },
    { icon: "\uD83D\uDCC5", label: t("loss.monthly"), value: monthlyLoss, sublabel: t("loss.monthly.sublabel") },
    { icon: "\uD83D\uDCC6", label: t("loss.yearly"), value: yearlyLoss, sublabel: t("loss.yearly.sublabel") },
  ];

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="stat-card rounded-[20px] p-6 text-center shadow-lg"
        >
          <p className="mb-2 text-2xl" aria-hidden="true">{card.icon}</p>
          <p className="text-3xl font-bold text-negative">
            -{formatCurrency(card.value, country)}
          </p>
          <p className="mt-2 text-sm font-medium text-text-secondary">
            {card.sublabel}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
