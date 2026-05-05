"use client";

import { useEffect, useState } from "react";
import { useNotifications } from "@/lib/notifications-context";

export default function NotificationsPage() {
  const {
    notifications,
    status,
    connectedCount,
    markAllRead,
    clear,
    sendTest,
  } = useNotifications();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visiting the page implies the visitor has seen everything; clear the badge.
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  async function handleSendTest() {
    setError(null);
    setSending(true);
    try {
      await sendTest();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diçka shkoi keq.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-gn-text text-2xl font-bold tracking-tight">
            Njoftimet
          </h1>
          <p className="text-gn-text-tertiary mt-1 text-sm">
            <StatusDot status={status} /> {statusLabel(status)} ·{" "}
            {connectedCount} {connectedCount === 1 ? "klient" : "klientë"}{" "}
            online · {notifications.length}{" "}
            {notifications.length === 1 ? "njoftim" : "njoftime"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendTest}
            disabled={sending || status !== "connected"}
            className="bg-gn-primary text-gn-text-inverse inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Duke derguar..." : "Dergo njoftim test"}
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={notifications.length === 0}
            className="text-gn-text-secondary border-gn-border hover:bg-gn-overlay inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Pastro
          </button>
        </div>
      </div>

      {error && (
        <div className="border-gn-danger text-gn-danger mb-4 rounded-lg border px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="border-gn-border-light bg-gn-surface text-gn-text-tertiary rounded-xl border px-6 py-16 text-center text-sm">
          Asnje njoftim ende. Kur te arrije nje njoftim, do te shfaqet ketu.
        </div>
      ) : (
        <ul className="bg-gn-surface border-gn-border divide-gn-border-light divide-y overflow-hidden rounded-xl border shadow-sm">
          {notifications.map((n) => (
            <li key={n.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${typeColor(n.type)}`}
                    />
                    <h2 className="text-gn-text text-sm font-semibold">
                      {n.title}
                    </h2>
                    <span className="text-gn-text-tertiary rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase dark:bg-white/10">
                      {n.type}
                    </span>
                  </div>
                  <p className="text-gn-text-secondary mt-1 text-sm">
                    {n.message}
                  </p>
                </div>
                <time
                  dateTime={n.createdAt}
                  className="text-gn-text-tertiary shrink-0 text-xs tabular-nums"
                >
                  {formatTime(n.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "connected"
      ? "bg-emerald-500"
      : status === "connecting"
        ? "bg-amber-500"
        : "bg-gray-400";
  return (
    <span
      className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${color}`}
      aria-hidden="true"
    />
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "connected":
      return "Ne lidhje";
    case "connecting":
      return "Duke u lidhur";
    default:
      return "Pa lidhje";
  }
}

function typeColor(type: string) {
  switch (type) {
    case "article.deleted":
      return "bg-gn-danger";
    case "test":
      return "bg-amber-400";
    default:
      return "bg-emerald-500";
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
