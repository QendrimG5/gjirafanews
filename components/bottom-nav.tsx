"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSavedArticles } from "@/lib/store/saved-articles";

const navItems = [
  {
    label: "Ballina",
    href: "/",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    label: "Ruajtura",
    href: "/saved",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    showBadge: true,
  },
  {
    label: "Temat",
    href: "/topics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const savedCount = useSavedArticles((s) => s.savedIds.length);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gn-surface/80 backdrop-blur-xl border-t border-gn-border-light sm:hidden">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-5 py-1.5 transition-colors ${
                isActive ? "text-gn-accent" : "text-gn-text-tertiary"
              }`}
            >
              {item.icon}
              {"showBadge" in item && item.showBadge && savedCount > 0 && (
                <span className="absolute top-0.5 right-3 min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full bg-gn-accent text-gn-text-inverse text-[9px] font-bold">
                  {savedCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
