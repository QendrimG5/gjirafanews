"use client";

import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const { mutateAsync: logout, isPending } = useLogoutMutation();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="text-xs text-white/60 transition-colors hover:text-white disabled:opacity-50"
    >
      Dil
    </button>
  );
}
