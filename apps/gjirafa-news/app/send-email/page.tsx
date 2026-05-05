"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type Status = "idle" | "sending" | "sent" | "error";

export default function SendEmailPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  function handleReset() {
    setTo("");
    setSubject("");
    setBody("");
    setStatus("idle");
    setError(null);
  }

  const sending = status === "sending";

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-gn-text text-2xl font-bold tracking-tight">
          Dërgo email
        </h1>
        <p className="text-gn-text-tertiary mt-1 text-sm">
          Mesazhi kalon nëpër Papercut SMTP. Hape{" "}
          <a
            href="http://localhost:37408"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gn-accent underline"
          >
            http://localhost:37408
          </a>{" "}
          për ta lexuar.
        </p>
      </header>

      <form
        onSubmit={handleSend}
        className="bg-gn-surface border-gn-border space-y-4 rounded-xl border p-5 shadow-sm"
      >
        <label className="block">
          <span className="text-gn-text-secondary mb-1 block text-sm font-medium">
            Marrësi
          </span>
          <input
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={sending}
            placeholder="emri@example.com"
            className="border-gn-border focus:border-gn-primary text-gn-text bg-gn-background block w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-gn-text-secondary mb-1 block text-sm font-medium">
            Subjekti
          </span>
          <input
            type="text"
            required
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            className="border-gn-border focus:border-gn-primary text-gn-text bg-gn-background block w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
        </label>

        <label className="block">
          <span className="text-gn-text-secondary mb-1 block text-sm font-medium">
            Përmbajtja
          </span>
          <textarea
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sending}
            className="border-gn-border focus:border-gn-primary text-gn-text bg-gn-background block w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
          />
        </label>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={sending}
            className="bg-gn-primary text-gn-text-inverse inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Duke dërguar..." : "Dërgo"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={sending}
            className="text-gn-text-secondary border-gn-border hover:bg-gn-overlay inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Pastro
          </button>
        </div>

        {status === "sent" && (
          <div className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border px-4 py-3 text-sm">
            Email-i u dërgua. Hape Papercut UI për ta parë.
          </div>
        )}

        {status === "error" && error && (
          <div className="border-gn-danger/40 bg-gn-danger/10 text-gn-danger rounded-lg border px-4 py-3 text-sm">
            <div className="font-semibold">Gabim gjatë dërgimit</div>
            <div className="mt-1 break-all">{error}</div>
          </div>
        )}
      </form>
    </div>
  );
}
