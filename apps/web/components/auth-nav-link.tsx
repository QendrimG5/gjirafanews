"use client";

import { useGetMeQuery } from "@/lib/store/api";

export default function AuthNavLink() {
  const { data, isLoading } = useGetMeQuery();

  if (isLoading) return null;

  if (data?.user && data.user.role === "admin") {
    return (
      <a
        href="http://localhost:3002"
        className="bg-gn-primary text-gn-text-inverse rounded-full px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
      >
        Admin
      </a>
    );
  }

  return (
    <a
      href="http://localhost:3002/login"
      className="text-gn-text-secondary hover:text-gn-text text-sm transition-colors"
    >
      Kyqu
    </a>
  );
}
