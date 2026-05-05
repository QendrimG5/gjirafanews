import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import LogoutButton from "./logout-button";

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-gn-primary text-gn-text-inverse">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-5">
            <Link to="/" className="text-sm font-semibold tracking-tight">
              Admin Panel
            </Link>
            <Link
              to="/articles/new"
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              + Artikull i ri
            </Link>
            <Link
              to="/categories"
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              Kategorite
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/50">{user?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </div>
    </div>
  );
}
