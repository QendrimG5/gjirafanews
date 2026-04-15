import Link from "next/link";
import AuthNavLink from "@/components/auth-nav-link";
import SavedCount from "@/components/saved-count";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  return (
    <header className="bg-gn-surface/80 border-gn-border-light sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4338ca]">
            <svg
              className="h-4 w-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-gn-text text-lg font-semibold tracking-tight">
            Pulse<span className="text-gn-accent">News</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/topics"
            className="text-gn-text-secondary hover:text-gn-text text-sm transition-colors"
          >
            Temat
          </Link>
          <ThemeToggle />
          <SavedCount />
          <AuthNavLink />
        </nav>
      </div>
    </header>
  );
}
