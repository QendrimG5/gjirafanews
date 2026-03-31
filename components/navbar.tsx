import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gn-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gn-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-xl font-bold text-gn-gray-900">
            Gjirafa<span className="text-gn-green">News</span>
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-4">
          <Link
            href="/topics"
            className="text-sm text-gn-gray-500 hover:text-gn-green transition-colors"
          >
            Temat
          </Link>
        </nav>
      </div>
    </header>
  );
}
