"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";

export default function ChatPage() {
  return (
    <main className="min-h-screen pt-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-card">
          <ChatPanel isOpen={true} onClose={() => {}} fullPage={true} />
        </div>
      </div>
    </main>
  );
}
