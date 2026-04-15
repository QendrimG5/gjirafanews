import { useNavigate } from "react-router-dom";
import { useLogoutMutation } from "@/lib/api";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { mutateAsync: logout, isPending } = useLogoutMutation();

  async function handleLogout() {
    await logout();
    navigate("/login");
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
