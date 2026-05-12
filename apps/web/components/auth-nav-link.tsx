"use client";

import { useSession, signIn } from "next-auth/react";
import { env } from "@/lib/env";

type SessionWithRoles = ReturnType<typeof useSession>["data"] & {
  roles?: string[];
};

export default function AuthNavLink() {
  const { data, status } = useSession();
  if (status === "loading") return null;

  const roles = (data as SessionWithRoles | null)?.roles ?? [];
  if (data && roles.includes("admin")) {
    return (
      <a
        href={env.NEXT_PUBLIC_ADMIN_URL}
        className="bg-gn-primary text-gn-text-inverse rounded-full px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80"
      >
        Admin
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("keycloak")}
      className="text-gn-text-secondary hover:text-gn-text text-sm transition-colors"
    >
      Kyqu
    </button>
  );
}
