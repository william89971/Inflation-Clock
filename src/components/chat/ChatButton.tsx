"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChatPanel } from "./ChatPanel";

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-bitcoin to-bitcoin-light text-2xl text-white shadow-lg shadow-bitcoin/30 sm:right-6"
      >
        {isOpen ? "\u00D7" : "\uD83D\uDCAC"}
      </motion.button>
    </>
  );
}
