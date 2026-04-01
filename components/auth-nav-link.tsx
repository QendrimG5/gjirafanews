"use client";

import Link from "next/link";
import { useGetMeQuery } from "@/lib/store/api";

export default function AuthNavLink() {
  const { data, isLoading } = useGetMeQuery();

  if (isLoading) return null;

  if (data?.user && data.user.role === "admin") {
    return (
      <Link
        href="/admin"
        className="text-sm px-3 py-1.5 rounded-full bg-gn-primary text-gn-text-inverse font-medium transition-opacity hover:opacity-80"
      >
        Admin
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm text-gn-text-secondary hover:text-gn-text transition-colors"
    >
      Kyqu
    </Link>
  );
}
