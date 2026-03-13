"use client";

import { ReactNode } from "react";
import { ChatButton } from "@/components/chat/ChatButton";

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ChatButton />
    </>
  );
}
