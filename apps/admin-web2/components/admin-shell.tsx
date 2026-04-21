"use client";

import Link from "next/link";
import { useGetMeQuery } from "@/lib/api";
import LogoutButton from "./logout-button";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useGetMeQuery();

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-gn-primary text-gn-text-inverse">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-5">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Admin Panel
            </Link>
            <Link
              href="/articles/new"
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              + Artikull i ri
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50">{data?.user?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </div>
  );
}
