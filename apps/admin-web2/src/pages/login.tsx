import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "@/lib/api";
import { Button } from "@gjirafanews/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const { mutateAsync: login, isPending } = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/");
    } catch (err: unknown) {
      const apiError = err as { data?: { error?: string } };
      setError(apiError?.data?.error || "Login failed. Please try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4338ca]">
            <span className="text-lg font-bold text-white">P</span>
          </div>
          <h1 className="text-gn-text text-xl font-bold tracking-tight">
            Kyqu ne PulseNews
          </h1>
          <p className="text-gn-text-tertiary mt-1 text-sm">
            Fut te dhenat per te hyre ne panel
          </p>
        </div>

        {error && (
          <div className="bg-gn-danger-muted text-gn-danger mb-4 rounded-xl p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-gn-text-secondary mb-1.5 block text-xs font-medium uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gn-surface border-gn-border text-gn-text focus:ring-gn-primary/20 focus:border-gn-primary w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
              placeholder="email@shembull.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-gn-text-secondary mb-1.5 block text-xs font-medium uppercase tracking-wider"
            >
              Fjalekalimi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gn-surface border-gn-border text-gn-text focus:ring-gn-primary/20 focus:border-gn-primary w-full rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2"
              placeholder="Shkruaj fjalekalimin"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="bg-gn-primary text-gn-text-inverse w-full"
          >
            {isPending ? "Duke u kyqur..." : "Kyqu"}
          </Button>
        </form>
      </div>
    </div>
  );
}
