"use client";

import { useHomePageContext } from "./homepage-context";

export function LiveChatHeader() {
  const { onlineCount, connected } = useHomePageContext();

  return (
    <div className="border-gn-border-light flex items-center gap-3 border-b px-5 py-3.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
        LC
      </div>
      <div className="flex-1">
        <h3 className="text-gn-text text-sm font-semibold">Live Chat</h3>
        <p className="text-gn-text-tertiary text-[11px]">
          {onlineCount} {onlineCount === 1 ? "person" : "persona"} online
        </p>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          connected
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 text-red-600 dark:text-red-400"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connected ? "animate-pulse bg-emerald-500" : "bg-red-500"
          }`}
        />
        {connected ? "Live" : "Duke u lidhur..."}
      </span>
    </div>
  );
}
