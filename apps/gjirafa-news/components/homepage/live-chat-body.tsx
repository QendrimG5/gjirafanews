"use client";

import { useHomePageContext } from "./homepage-context";

function usernameColor(name: string): string {
  const colors = [
    "text-blue-600 dark:text-blue-400",
    "text-purple-600 dark:text-purple-400",
    "text-pink-600 dark:text-pink-400",
    "text-amber-600 dark:text-amber-400",
    "text-teal-600 dark:text-teal-400",
    "text-rose-600 dark:text-rose-400",
    "text-indigo-600 dark:text-indigo-400",
    "text-cyan-600 dark:text-cyan-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveChatBody() {
  const { messages, scrollRef, username } = useHomePageContext();
  const isEmpty = messages.length === 0;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
            <svg
              className="h-7 w-7 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-gn-text text-sm font-medium">
              Asnjë mesazh ende
            </p>
            <p className="text-gn-text-tertiary mt-1 text-xs">
              Bëhu i pari që shkruan diçka!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMe = msg.username === username;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    isMe
                      ? "bg-gn-accent rounded-br-md text-white"
                      : "bg-gn-surface border-gn-border-light rounded-bl-md border"
                  }`}
                >
                  {!isMe && (
                    <p
                      className={`text-[11px] font-semibold ${usernameColor(msg.username)}`}
                    >
                      {msg.username}
                    </p>
                  )}
                  <p
                    className={`text-sm leading-relaxed ${isMe ? "text-white" : "text-gn-text"}`}
                  >
                    {msg.text}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <p
                      className={`text-[10px] ${
                        isMe ? "text-white/60" : "text-gn-text-tertiary"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                    {msg._optimistic && (
                      <svg
                        className="h-3 w-3 animate-spin text-white/50"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
