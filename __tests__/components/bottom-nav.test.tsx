/**
 * ============================================================================
 * TEST SUITE: components/bottom-nav.tsx — BottomNav mobile navigation
 * ============================================================================
 *
 * This file tests the BottomNav component which:
 *   - Renders a fixed bottom navigation bar for mobile devices
 *   - Shows 3 nav items: Ballina (/), Ruajtura (/saved), Temat (/topics)
 *   - Highlights the active item based on current pathname
 *   - Shows a saved count badge on the "Ruajtura" item when count > 0
 *   - Is hidden on desktop (sm:hidden class)
 *
 * WHY these tests matter:
 *   BottomNav is the primary navigation on mobile. It's fixed at the
 *   bottom of every page. If the badge shows incorrectly or links point
 *   to wrong routes, mobile users can't navigate or see their saved count.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// ─── Mock the Zustand store ────────────────────────────────────────────────
let mockSavedIds: string[] = [];

jest.mock("@/lib/store/saved-articles", () => ({
  useSavedArticles: (selector?: (state: { savedIds: string[] }) => unknown) => {
    const state = { savedIds: mockSavedIds };
    return selector ? selector(state) : state;
  },
}));

// Control what pathname the component sees.
let mockPathname = "/";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

import BottomNav from "@/components/bottom-nav";

describe("BottomNav component", () => {

  beforeEach(() => {
    mockPathname = "/";
    mockSavedIds = [];
  });

  test("should render a <nav> element", () => {
    render(<BottomNav />);

    // getByRole("navigation") finds the <nav> element.
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  test("should render the 'Ballina' (Home) link", () => {
    render(<BottomNav />);

    // "Ballina" = Albanian for "Homepage"
    const ballina = screen.getByText("Ballina");
    expect(ballina).toBeInTheDocument();
  });

  test("should render the 'Ruajtura' (Saved) link", () => {
    render(<BottomNav />);

    // "Ruajtura" = Albanian for "Saved"
    const ruajtura = screen.getByText("Ruajtura");
    expect(ruajtura).toBeInTheDocument();
  });

  test("should render the 'Temat' (Topics) link", () => {
    render(<BottomNav />);

    const temat = screen.getByText("Temat");
    expect(temat).toBeInTheDocument();
  });

  test("should have 3 navigation links", () => {
    render(<BottomNav />);

    // getAllByRole("link") finds all <a> elements.
    const links = screen.getAllByRole("link");
    // Exactly 3: Ballina, Ruajtura, Temat
    expect(links).toHaveLength(3);
  });

  test("'Ballina' link should point to '/'", () => {
    render(<BottomNav />);

    const ballina = screen.getByText("Ballina");
    const link = ballina.closest("a");
    expect(link?.getAttribute("href")).toEqual("/");
  });

  test("'Ruajtura' link should point to '/saved'", () => {
    render(<BottomNav />);

    const ruajtura = screen.getByText("Ruajtura");
    const link = ruajtura.closest("a");
    expect(link?.getAttribute("href")).toEqual("/saved");
  });

  test("'Temat' link should point to '/topics'", () => {
    render(<BottomNav />);

    const temat = screen.getByText("Temat");
    const link = temat.closest("a");
    expect(link?.getAttribute("href")).toEqual("/topics");
  });

  test("should NOT show saved badge when there are no saved articles", () => {
    render(<BottomNav />);

    // The badge renders the saved count number. With 0 saved articles,
    // no badge should appear. queryByText returns null if not found.
    const badge = screen.queryByText("0");
    expect(badge).toBeNull();
  });

  test("should show saved badge with correct count when articles are saved", () => {
    // Pre-set 5 saved articles.
    mockSavedIds = ["art-1", "art-2", "art-3", "art-4", "art-5"];

    render(<BottomNav />);

    // The badge should display "5".
    const badge = screen.getByText("5");
    expect(badge).toBeInTheDocument();
  });

  test("should apply active styling to 'Ballina' when on homepage", () => {
    mockPathname = "/";
    render(<BottomNav />);

    const ballinaLink = screen.getByText("Ballina").closest("a");
    // Active items get the "text-gn-accent" class.
    expect(ballinaLink?.className).toContain("text-gn-accent");
  });

  test("should apply active styling to 'Ruajtura' when on /saved", () => {
    mockPathname = "/saved";
    render(<BottomNav />);

    const ruajturaLink = screen.getByText("Ruajtura").closest("a");
    expect(ruajturaLink?.className).toContain("text-gn-accent");
  });

  test("should apply active styling to 'Temat' when on /topics", () => {
    mockPathname = "/topics";
    render(<BottomNav />);

    const tematLink = screen.getByText("Temat").closest("a");
    expect(tematLink?.className).toContain("text-gn-accent");
  });

  test("should NOT apply active styling to non-matching items", () => {
    mockPathname = "/saved";
    render(<BottomNav />);

    // When on /saved, "Ballina" should NOT have the active class.
    const ballinaLink = screen.getByText("Ballina").closest("a");
    expect(ballinaLink?.className).not.toContain("text-gn-accent");
  });

  test("each nav item should render an SVG icon", () => {
    render(<BottomNav />);

    // Each of the 3 nav items has an SVG icon.
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const svg = link.querySelector("svg");
      // Each link should contain an SVG element.
      expect(svg).not.toBeNull();
    });
  });
});
