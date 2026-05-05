"use client";

import { createContext, useContext } from "react";
import type { ChatConfig, ChatContextValue } from "./types";
import { useChat } from "./use-chat";

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({
  config,
  children,
}: {
  config: ChatConfig;
  children: React.ReactNode;
}) {
  const chat = useChat(config);

  return <ChatContext value={chat}>{children}</ChatContext>;
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
