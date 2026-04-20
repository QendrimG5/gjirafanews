"use client";

import { useChatContext } from "./chat-context";

const SUGGESTIONS: Record<string, string[]> = {
  "cat-1": [
    "Si po shkon dialogu Kosovë-Serbi?",
    "Çka ndodh me zgjedhjet lokale?",
    "Reformat për integrim evropian?",
  ],
  "cat-2": [
    "Si po shkon Superliga?",
    "Shanset për olimpiade?",
    "Lajme nga futbolli kosovar?",
  ],
  "cat-3": [
    "Si po zhvillohet AI në Kosovë?",
    "Lajme për startup-et vendore?",
    "Çka po ndodh me 5G?",
  ],
  "cat-4": [
    "Festivalet e filmit në Kosovë?",
    "Lajme nga skena e muzikës?",
    "Artistët kosovarë ndërkombëtarë?",
  ],
  "cat-5": [
    "Si po shkojnë eksportet?",
    "Investimet e huaja në Kosovë?",
    "Situata ekonomike aktuale?",
  ],
  "cat-6": [
    "Kosova dhe Bashkimi Evropian?",
    "Zhvillimet me NATO-n?",
    "Situata gjeopolitike në rajon?",
  ],
};

export function ChatBody() {
  const { messages, sendMessage, scrollRef, config } = useChatContext();
  const isEmpty = messages.length === 0;
  const suggestions = SUGGESTIONS[config.categoryId] ?? SUGGESTIONS["cat-1"];

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
            <svg
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-gn-text text-sm font-medium">
              Pyet rreth {config.categoryName}
            </p>
            <p className="text-gn-text-tertiary mt-1 text-xs">
              Përgjigjet streamen me SSE, fjalë për fjalë
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-gn-text-secondary border-gn-border-light hover:border-gn-accent hover:text-gn-accent rounded-full border px-3.5 py-1.5 text-xs transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gn-accent rounded-br-md text-white"
                    : "bg-gn-surface border-gn-border-light text-gn-text rounded-bl-md border"
                }`}
              >
                {msg.role === "assistant" && msg.state === "thinking" && (
                  <div className="flex items-center gap-2">
                    <ThinkingDots />
                    <span className="text-gn-text-tertiary text-xs">
                      Po mendoj...
                    </span>
                  </div>
                )}
                {msg.role === "assistant" &&
                  msg.state === "generating" &&
                  msg.text === "" && (
                    <div className="flex items-center gap-2">
                      <ThinkingDots />
                      <span className="text-gn-text-tertiary text-xs">
                        Po shkruaj...
                      </span>
                    </div>
                  )}
                {msg.text && (
                  <span>
                    {msg.text}
                    {msg.state === "generating" && <Cursor />}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="bg-gn-text-tertiary h-1.5 w-1.5 rounded-full"
          style={{
            animation: "pulse 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}

function Cursor() {
  return (
    <span
      className="bg-gn-accent ml-0.5 inline-block h-4 w-0.5 align-text-bottom"
      style={{ animation: "blink 1s step-end infinite" }}
    />
  );
}
