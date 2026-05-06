"use client";

import { useCallback, useEffect, useState } from "react";
import { env } from "@/lib/env";

const API_URL = env.NEXT_PUBLIC_API_BASE_URL;

type PublishResponse = {
  topic: string;
  partition: number;
  offset: number;
};

type ConsumedMessage = {
  topic: string;
  partition: number;
  offset: number;
  key: string | null;
  value: string;
  consumedAt: string;
};

type Status = "idle" | "publishing" | "published" | "error";

export default function MessagesPage() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<PublishResponse | null>(null);
  const [messages, setMessages] = useState<ConsumedMessage[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/messages`, { cache: "no-store" });
      if (!res.ok) return;
      setMessages((await res.json()) as ConsumedMessage[]);
    } catch {
      /* swallow — network refresh failures are non-fatal */
    }
  }, []);

  // Poll the API consumer's recent buffer so the UI shows messages as they
  // round-trip. The standalone console consumer logs to its own container's
  // stdout — view those with `docker logs gjirafanews-kafka-consumer-1`.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  async function handlePublish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("publishing");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key || null, value }),
      });
      if (!res.ok) {
        throw new Error(`${res.status} ${await res.text()}`);
      }
      const body = (await res.json()) as PublishResponse;
      setLast(body);
      setStatus("published");
      setValue("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  const publishing = status === "publishing";

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-gn-text text-2xl font-bold tracking-tight">
          Mesazhe Kafka
        </h1>
        <p className="text-gn-text-tertiary mt-1 text-sm">
          Dërgo një mesazh në temën{" "}
          <code className="bg-gn-overlay rounded px-1 py-0.5 text-xs">
            messages.demo
          </code>
          . Të dy konsumatorët (API dhe konsola) e marrin paralelisht. Hape{" "}
          <a
            href="http://localhost:8090"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gn-accent underline"
          >
            Kafka UI
          </a>{" "}
          për ta inspektuar.
        </p>
      </header>

      <form
        onSubmit={handlePublish}
        className="bg-gn-surface border-gn-border mb-6 space-y-4 rounded-xl border p-5 shadow-sm"
      >
        <label className="block">
          <span className="text-gn-text-secondary mb-1 block text-sm font-medium">
            Çelësi (opsional)
          </span>
          <input
            type="text"
            maxLength={256}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={publishing}
            placeholder="p.sh. order-1"
            className="border-gn-border focus:border-gn-primary text-gn-text bg-gn-background block w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-gn-text-secondary mb-1 block text-sm font-medium">
            Përmbajtja
          </span>
          <textarea
            required
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={publishing}
            className="border-gn-border focus:border-gn-primary text-gn-text bg-gn-background block w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
        </label>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={publishing || !value}
            className="bg-gn-primary text-gn-text-inverse inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? "Duke dërguar..." : "Dërgo eventin"}
          </button>
        </div>

        {status === "published" && last && (
          <div className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border px-4 py-3 text-sm">
            Eventi u dërgua →{" "}
            <span className="font-mono">
              {last.topic} [p{last.partition} o{last.offset}]
            </span>
          </div>
        )}

        {status === "error" && error && (
          <div className="border-gn-danger/40 bg-gn-danger/10 text-gn-danger rounded-lg border px-4 py-3 text-sm">
            <div className="font-semibold">Gabim gjatë dërgimit</div>
            <div className="mt-1 break-all">{error}</div>
          </div>
        )}
      </form>

      <section>
        <div className="text-gn-text-tertiary mb-2 flex items-center justify-between text-xs font-medium tracking-wide uppercase">
          <span>Eventet e fundit (API consumer)</span>
          <span className="tabular-nums">{messages.length}</span>
        </div>
        {messages.length === 0 ? (
          <div className="border-gn-border-light bg-gn-surface text-gn-text-tertiary rounded-xl border px-6 py-12 text-center text-sm">
            Asnjë event ende. Dërgo një mesazh më lart.
          </div>
        ) : (
          <ul className="bg-gn-surface border-gn-border divide-gn-border-light divide-y overflow-hidden rounded-xl border shadow-sm">
            {[...messages].reverse().map((m) => (
              <li
                key={`${m.topic}-${m.partition}-${m.offset}`}
                className="px-5 py-3"
              >
                <div className="text-gn-text-tertiary flex items-center justify-between text-xs tabular-nums">
                  <span className="font-mono">
                    {m.topic} [p{m.partition} o{m.offset}]
                    {m.key ? ` · key=${m.key}` : ""}
                  </span>
                  <time dateTime={m.consumedAt}>{formatTime(m.consumedAt)}</time>
                </div>
                <div className="text-gn-text mt-1 text-sm break-words">
                  {m.value}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("sq-AL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
