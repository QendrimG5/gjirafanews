"use client";

import { useChatContext } from "./chat-context";

export function ChatHeader() {
  const { config } = useChatContext();

  return (
    <div className="border-gn-border-light flex items-center gap-3 border-b px-5 py-3.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
        GN
      </div>
      <div className="flex-1">
        <h3 className="text-gn-text text-sm font-semibold">
          GjirafaNews AI — {config.categoryName}
        </h3>
        <p className="text-gn-text-tertiary text-[11px]">
          Asistenti i lajmeve — powered by SSE
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Online
      </span>
    </div>
  );
}
