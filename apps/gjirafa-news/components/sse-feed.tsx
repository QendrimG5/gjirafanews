"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface SSEMessage {
  id: string;
  type: string;
  data: string;
  timestamp: number;
}

interface Analytics {
  pageViews: number;
  visitors: number;
  bounceRate: number;
  avgSession: number;
  conversions: number;
  revenue: number;
}

const ROW_HEIGHT = 62;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initAnalytics(): Analytics {
  return {
    pageViews: rand(8000, 15000),
    visitors: rand(2000, 6000),
    bounceRate: rand(25, 55),
    avgSession: rand(90, 300),
    conversions: rand(50, 400),
    revenue: rand(500, 5000),
  };
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

const STAT_CARDS: {
  key: keyof Analytics;
  label: string;
  format: (v: number) => string;
  color: string;
}[] = [
  {
    key: "pageViews",
    label: "Page Views",
    format: formatNumber,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "visitors",
    label: "Visitors",
    format: formatNumber,
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    key: "bounceRate",
    label: "Bounce Rate",
    format: (v) => `${v}%`,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "avgSession",
    label: "Avg Session",
    format: formatDuration,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "conversions",
    label: "Conversions",
    format: formatNumber,
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    key: "revenue",
    label: "Revenue",
    format: (v) => `$${formatNumber(v)}`,
    color: "text-teal-600 dark:text-teal-400",
  },
];

export default function SSEFeed() {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>(initAnalytics);
  const [deltas, setDeltas] = useState<Partial<Record<keyof Analytics, number>>>({});
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource("https://sse.dev/test");

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      const msg: SSEMessage = {
        id: crypto.randomUUID(),
        type: "message",
        data: event.data,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);

      // On each SSE event, randomly bump analytics
      const pvDelta = rand(5, 80);
      const visDelta = rand(1, 30);
      const brDelta = rand(-3, 3);
      const asDelta = rand(-10, 15);
      const convDelta = rand(0, 8);
      const revDelta = rand(5, 120);

      setDeltas({
        pageViews: pvDelta,
        visitors: visDelta,
        bounceRate: brDelta,
        avgSession: asDelta,
        conversions: convDelta,
        revenue: revDelta,
      });

      setAnalytics((prev) => ({
        pageViews: prev.pageViews + pvDelta,
        visitors: prev.visitors + visDelta,
        bounceRate: Math.max(5, Math.min(85, prev.bounceRate + brDelta)),
        avgSession: Math.max(30, prev.avgSession + asDelta),
        conversions: prev.conversions + convDelta,
        revenue: prev.revenue + revDelta,
      }));
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setConnected(false);
        setError("Connection closed");
      } else {
        setError("Connection lost — reconnecting…");
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString();
  }

  return (
    <div className="bg-gn-overlay border-gn-border-light rounded-2xl border p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-gn-text text-sm font-semibold tracking-wider uppercase">
          Live Analytics
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-gn-text/50 text-xs">
            {messages.length} events
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              connected
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            />
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      {/* Analytics cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map((stat) => {
          const delta = deltas[stat.key];
          return (
            <div
              key={stat.key}
              className="bg-gn-surface border-gn-border-light rounded-xl border px-3 py-3"
            >
              <p className="text-gn-text/50 text-[11px] font-medium uppercase tracking-wide">
                {stat.label}
              </p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${stat.color}`}>
                {stat.format(analytics[stat.key])}
              </p>
              {delta != null && delta !== 0 && (
                <p
                  className={`mt-0.5 text-[11px] font-medium ${
                    delta > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {stat.key === "bounceRate"
                    ? `${delta}%`
                    : stat.key === "avgSession"
                      ? `${delta}s`
                      : stat.key === "revenue"
                        ? `$${delta}`
                        : delta}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Event log (virtual list) */}
      <p className="text-gn-text/50 mb-2 text-[11px] font-medium uppercase tracking-wide">
        Event Log
      </p>
      <div ref={parentRef} className="h-52 overflow-y-auto rounded-lg">
        {messages.length === 0 ? (
          <p className="text-gn-text/50 py-6 text-center text-sm">
            Waiting for events…
          </p>
        ) : (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const msg = messages[virtualRow.index];
              return (
                <div
                  key={msg.id}
                  className="absolute left-0 w-full px-0.5"
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="bg-gn-surface border-gn-border-light rounded-lg border px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gn-text/50 font-mono text-[10px]">
                        {formatTime(msg.timestamp)}
                      </span>
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                        {msg.type}
                      </span>
                    </div>
                    <p className="text-gn-text mt-1 truncate text-sm">
                      {msg.data}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
