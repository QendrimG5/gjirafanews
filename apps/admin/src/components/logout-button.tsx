import { useAuth } from "@/lib/auth-context";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="text-xs text-white/60 transition-colors hover:text-white"
    >
      Dil
    </button>
  );
}
