"use client";

import Link from "next/link";
import { useNotifications } from "@/lib/notifications-context";

export default function NotificationsNavLink() {
  const { unreadCount, status } = useNotifications();

  return (
    <Link
      href="/notifications"
      className="text-gn-text-secondary hover:text-gn-text relative transition-colors"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} njoftime te reja`
          : "Njoftimet"
      }
      title={`SignalR: ${status}`}
    >
      <svg
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="bg-gn-accent text-gn-text-inverse absolute -top-1.5 -right-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <span
        className={
          "absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full " +
          (status === "connected"
            ? "bg-emerald-500"
            : status === "connecting"
              ? "bg-amber-500"
              : "bg-gray-400")
        }
        aria-hidden="true"
      />
    </Link>
  );
}
