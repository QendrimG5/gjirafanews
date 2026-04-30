import Link from "next/link";
import AuthNavLink from "@/components/auth-nav-link";
import SavedCount from "@/components/saved-count";
import ThemeToggle from "@/components/theme-toggle";
import NotificationsNavLink from "@/components/notifications-nav-link";

export default function Navbar() {
  return (
    <header className="bg-gn-surface/80 border-gn-border-light sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-gn-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="text-gn-text-inverse text-sm font-bold tracking-tight">
              G
            </span>
          </div>
          <span className="text-gn-text text-lg font-semibold tracking-tight">
            Gjirafa<span className="text-gn-accent">News</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/topics"
            className="text-gn-text-secondary hover:text-gn-text text-sm transition-colors"
          >
            Temat
          </Link>
          <Link
            href="/dashboard"
            className="text-gn-text-secondary hover:text-gn-text text-sm transition-colors"
          >
            Dashboard
          </Link>
          <ThemeToggle />
          <SavedCount />
          <NotificationsNavLink />
          <AuthNavLink />
        </nav>
      </div>
    </header>
  );
}
