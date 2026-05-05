"use client";

import type { ChatConfig } from "./types";
import { ChatProvider } from "./chat-context";
import { ChatHeader } from "./chat-header";
import { ChatBody } from "./chat-body";
import { ChatInput } from "./chat-input";

export default function AIChat({ config }: { config: ChatConfig }) {
  return (
    <ChatProvider config={config}>
      <div className="bg-gn-overlay border-gn-border-light flex h-[520px] flex-col overflow-hidden rounded-2xl border">
        <ChatHeader />
        <ChatBody />
        <ChatInput />
      </div>
    </ChatProvider>
  );
}
