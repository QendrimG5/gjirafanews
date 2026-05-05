"use client";

import { useChatContext } from "./chat-context";

export function ChatInput() {
  const { input, setInput, streaming, sendMessage, stopStreaming } =
    useChatContext();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="border-gn-border-light border-t px-4 py-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Shkruaj mesazhin..."
          disabled={streaming}
          className="text-gn-text placeholder:text-gn-text-tertiary bg-gn-surface border-gn-border-light flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-emerald-500 disabled:opacity-50"
        />
        {streaming ? (
          <button
            type="button"
            onClick={stopStreaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
            aria-label="Ndalo"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-gn-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-30"
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
        )}
      </form>
    </div>
  );
}
