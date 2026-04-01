"use client";

import { useRouter } from "next/navigation";
import { useLogoutMutation } from "@/lib/store/api";
import { useAppDispatch } from "@/lib/store/hooks";
import { clearUser } from "@/lib/store/authSlice";

// Calls POST /api/auth/logout via TanStack mutation.
//
// `mutateAsync` is the async version of `mutate` — it returns a promise we
// can await before navigating. The `onSuccess` callback in the hook
// definition (api.ts) already invalidates the "auth.me" cache, so the navbar
// will flip back to showing the "Kyqu" link.
//
// We also dispatch `clearUser()` to clear the Redux auth slice, keeping both
// state stores in sync.

export default function AdminLogoutButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { mutateAsync: logout, isPending } = useLogoutMutation();

  async function handleLogout() {
    await logout();
    dispatch(clearUser());
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="text-xs text-gn-gray-200 hover:text-white transition-colors disabled:opacity-50"
    >
      Dil
    </button>
  );
}
