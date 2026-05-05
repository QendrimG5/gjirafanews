"use client";

import { LiveChatHeader } from "./live-chat-header";
import { LiveChatBody } from "./live-chat-body";
import { LiveChatInput } from "./live-chat-input";

export function LiveChat() {
  return (
    <div className="bg-gn-overlay border-gn-border-light flex h-[520px] flex-col overflow-hidden rounded-2xl border">
      <LiveChatHeader />
      <LiveChatBody />
      <LiveChatInput />
    </div>
  );
}
