"use client";

import Link from "next/link";
import { useDashboard, type DashboardStatus } from "@/lib/dashboard-hub";

export default function DashboardPage() {
  const { snapshot, status } = useDashboard();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-gn-text text-2xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-gn-text-tertiary mt-1 text-sm">
            <StatusDot status={status} /> {statusLabel(status)}
            {snapshot && (
              <>
                {" · përditësuar "}
                <time dateTime={snapshot.generatedAt} className="tabular-nums">
                  {formatTime(snapshot.generatedAt)}
                </time>
              </>
            )}
          </p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Klientë online"
          value={snapshot?.realtimeUsers}
          accent="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="Në chat"
          value={snapshot?.chatUsers}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Artikuj"
          value={snapshot?.articlesCount}
          accent="text-indigo-600 dark:text-indigo-400"
        />
        <MetricCard
          label="Njoftime"
          value={snapshot?.notificationsCount}
          accent="text-amber-600 dark:text-amber-400"
        />
        <MetricCard
          label="Mesazhe chat"
          value={snapshot?.chatMessagesCount}
          accent="text-rose-600 dark:text-rose-400"
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <LatestCard label="Njoftimi i fundit">
          {snapshot?.latestNotification ? (
            <>
              <div className="text-gn-text mt-1 truncate text-sm font-semibold">
                {snapshot.latestNotification.title}
              </div>
              <div className="text-gn-text-tertiary mt-0.5 text-xs tabular-nums">
                {formatTime(snapshot.latestNotification.createdAt)}
              </div>
              <Link
                href="/notifications"
                className="text-gn-accent mt-2 inline-block text-xs font-medium hover:underline"
              >
                Shih të gjitha →
              </Link>
            </>
          ) : (
            <div className="text-gn-text-tertiary mt-1 text-sm">—</div>
          )}
        </LatestCard>

        <LatestCard label="Artikulli i fundit">
          {snapshot?.latestArticle ? (
            <>
              <div className="text-gn-text mt-1 truncate text-sm font-semibold">
                {snapshot.latestArticle.title}
              </div>
              <div className="text-gn-text-tertiary mt-0.5 text-xs tabular-nums">
                {formatTime(snapshot.latestArticle.publishedAt)}
              </div>
              <Link
                href="/"
                className="text-gn-accent mt-2 inline-block text-xs font-medium hover:underline"
              >
                Shfleto lajmet →
              </Link>
            </>
          ) : (
            <div className="text-gn-text-tertiary mt-1 text-sm">—</div>
          )}
        </LatestCard>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | undefined;
  accent: string;
}) {
  return (
    <div className="bg-gn-surface border-gn-border rounded-xl border px-4 py-3 shadow-sm">
      <div className="text-gn-text-tertiary text-[11px] font-medium tracking-wide uppercase">
        {label}
      </div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${accent}`}>
        {value === undefined ? "—" : value.toLocaleString("sq-AL")}
      </div>
    </div>
  );
}

function LatestCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gn-surface border-gn-border rounded-xl border px-4 py-3 shadow-sm">
      <div className="text-gn-text-tertiary text-[11px] font-medium tracking-wide uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

function StatusDot({ status }: { status: DashboardStatus }) {
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

function statusLabel(status: DashboardStatus): string {
  switch (status) {
    case "connected":
      return "Në lidhje";
    case "connecting":
      return "Duke u lidhur";
    default:
      return "Pa lidhje";
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
