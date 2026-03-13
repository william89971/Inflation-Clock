"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { getUserData } from "@/lib/user-context";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fullPage?: boolean;
}

export function ChatPanel({ isOpen, onClose, fullPage = false }: ChatPanelProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starters = [
    t("chat.starter1"),
    t("chat.starter2"),
    t("chat.starter3"),
    t("chat.starter4"),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming || messageCount >= 20) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);
    setMessageCount((c) => c + 1);

    const userData = getUserData();
    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          country: userData.country,
          language: locale,
        }),
      });

      if (!res.ok) throw new Error("Chat API error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: fullText,
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't process that right now. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const containerClass = fullPage
    ? "flex h-[calc(100vh-6rem)] flex-col"
    : "flex h-full flex-col";

  const content = (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-bitcoin to-bitcoin-light p-4">
        <div>
          <h2 className="font-[var(--font-heading)] font-bold text-white">{t("chat.title")}</h2>
          <p className="text-xs text-white/80">{t("chat.subtitle")}</p>
        </div>
        {!fullPage && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            &times;
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            {starters.map((starter) => (
              <button
                key={starter}
                onClick={() => sendMessage(starter)}
                className="suggested-pill block w-full text-left"
              >
                {starter}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="chat-bubble-bot">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-bitcoin/50" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-bitcoin/50" style={{ animationDelay: "0.1s" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-bitcoin/50" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Rate limit warning */}
      {messageCount >= 20 && (
        <div className="border-t border-border px-4 py-2 text-center text-xs text-negative">
          {t("chat.rateLimit")}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-border p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat.placeholder")}
            disabled={isStreaming || messageCount >= 20}
            className="input-warm flex-1 !rounded-[12px] !py-2 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming || messageCount >= 20}
            className="btn-primary !px-4 !py-2 !text-sm disabled:opacity-50"
          >
            {t("chat.send")}
          </button>
        </div>
      </form>
    </div>
  );

  if (fullPage) return content;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 right-4 z-50 h-[500px] w-[380px] overflow-hidden rounded-[20px] border border-border bg-white shadow-lg sm:right-6"
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
