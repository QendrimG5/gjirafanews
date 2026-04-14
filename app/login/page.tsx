"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLoginMutation } from "@/lib/store/api";
import { useAppDispatch } from "@/lib/store/hooks";
import { setUser } from "@/lib/store/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { mutateAsync: login, isPending } = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const result = await login({ email, password });
      dispatch(setUser(result.user));
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "login_completed", method: "email" });
      router.push("/admin");
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string } };
      const message = apiError?.data?.error || "Login failed. Please try again.";
      setError(message);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "login_failed", error_message: message });
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gn-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-gn-text-inverse font-bold text-lg">G</span>
          </div>
          <h1 className="text-xl font-bold text-gn-text tracking-tight">
            Kyqu ne GjirafaNews
          </h1>
          <p className="text-sm text-gn-text-tertiary mt-1">
            Fut te dhenat per te hyre ne panel
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-gn-danger-muted text-sm text-gn-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-gn-text-secondary mb-1.5 uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gn-surface border border-gn-border rounded-xl text-sm text-gn-text
                         focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary transition-all"
              placeholder="email@shembull.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-gn-text-secondary mb-1.5 uppercase tracking-wider"
            >
              Fjalekalimi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gn-surface border border-gn-border rounded-xl text-sm text-gn-text
                         focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary transition-all"
              placeholder="Shkruaj fjalekalimin"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-gn-primary text-gn-text-inverse rounded-xl text-sm font-semibold
                       hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Duke u kyqur..." : "Kyqu"}
          </button>
        </form>

        <p className="text-center text-sm text-gn-text-tertiary mt-6">
          <Link href="/" className="text-gn-text-secondary hover:text-gn-text transition-colors">
            Kthehu ne ballina
          </Link>
        </p>
      </div>
    </div>
  );
}
