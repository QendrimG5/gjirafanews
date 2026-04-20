"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Regjistrimi dështoi.");
        return;
      }

      setStatus("success");
      setMessage("Faleminderit! Je regjistruar me sukses.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Lidhja dështoi. Provo përsëri.");
    }
  }

  return (
    <section className="bg-gn-primary relative w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 80% at 85% 20%, var(--gn-accent) 0%, transparent 60%), radial-gradient(45% 60% at 10% 90%, var(--gn-accent-light) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 sm:py-16 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="max-w-xl">
          <span className="bg-gn-accent/15 text-gn-accent-light inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase">
            <span className="bg-gn-accent-light h-1.5 w-1.5 rounded-full" />
            Newsletter
          </span>
          <h2 className="text-gn-text-inverse mt-4 text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
            Lajmet më të rëndësishme, direkt në email-in tënd.
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            Një përmbledhje ditore e lajmeve kryesore — politikë, sport,
            teknologji dhe kulturë. Pa spam, anulo kurdo të duash.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full shrink-0 md:w-[420px]"
          noValidate
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              placeholder="emri@shembull.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="text-gn-text placeholder:text-gn-text-tertiary focus:ring-gn-accent-light h-12 flex-1 rounded-lg border border-white/10 bg-white px-4 text-sm outline-none focus:ring-2 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="bg-gn-accent hover:bg-gn-accent-light text-gn-text-inverse h-12 rounded-lg px-6 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading"
                ? "Duke regjistruar…"
                : status === "success"
                  ? "Regjistruar ✓"
                  : "Regjistrohu"}
            </button>
          </div>
          {message && (
            <p
              role="status"
              className={`mt-3 text-xs ${
                status === "success"
                  ? "text-gn-accent-light"
                  : "text-gn-danger-muted"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
