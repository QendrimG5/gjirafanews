"use client";

import { useState } from "react";
import { useHomePageContext } from "./homepage-context";

export function LiveChatInput() {
  const { sendMessage, connected } = useHomePageContext();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending || !connected) return;
    setSending(true);
    try {
      await sendMessage(text);
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-gn-border-light border-t px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={connected ? "Shkruaj mesazhin..." : "Duke u lidhur..."}
          disabled={!connected || sending}
          maxLength={500}
          className="text-gn-text placeholder:text-gn-text-tertiary bg-gn-surface border-gn-border-light flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || !connected || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-opacity hover:opacity-90 disabled:opacity-30"
          aria-label="Dergo"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
