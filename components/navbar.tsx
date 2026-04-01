import Link from "next/link";
import AuthNavLink from "@/components/auth-nav-link";
import SavedCount from "@/components/saved-count";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-gn-surface/80 backdrop-blur-xl border-b border-gn-border-light">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gn-primary rounded-lg flex items-center justify-center">
            <span className="text-gn-text-inverse font-bold text-sm tracking-tight">G</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-gn-text">
            Gjirafa<span className="text-gn-accent">News</span>
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <Link
            href="/topics"
            className="text-sm text-gn-text-secondary hover:text-gn-text transition-colors"
          >
            Temat
          </Link>
          <SavedCount />
          <AuthNavLink />
        </nav>
      </div>
    </header>
  );
}
