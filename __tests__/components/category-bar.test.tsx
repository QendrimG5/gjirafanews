/**
 * ============================================================================
 * TEST SUITE: components/category-bar.tsx — CategoryBar navigation component
 * ============================================================================
 *
 * This file tests the CategoryBar component which:
 *   - Renders a horizontal scrollable bar of category links
 *   - Includes a "Te gjitha" (All) link that points to "/"
 *   - Highlights the active category based on the current URL pathname
 *   - Receives categories as a prop (not from a store)
 *
 * WHY these tests matter:
 *   CategoryBar appears on the homepage and every category page. It's the
 *   primary navigation for browsing news by topic. If links are wrong or
 *   the active state doesn't highlight correctly, users can't navigate.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Variable to control what usePathname returns in each test.
// `let` because we reassign it in different tests.
let mockPathname = "/";

// Mock next/navigation to control the pathname.
// CategoryBar uses usePathname() to determine which category is active.
jest.mock("next/navigation", () => ({
  // usePathname returns whatever mockPathname is set to.
  usePathname: () => mockPathname,
}));

// Mock next/link — replace with <a> for simple testing.
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

// Import the component after mocks are set up.
import CategoryBar from "@/components/category-bar";

// Test categories that mimic the shape of the real data.
const testCategories = [
  { id: "cat-1", name: "Politika", slug: "politika", color: "#cf222e" },
  { id: "cat-2", name: "Sport", slug: "sport", color: "#1a7f37" },
  { id: "cat-3", name: "Teknologji", slug: "teknologji", color: "#0969da" },
];

describe("CategoryBar component", () => {

  // Reset the mock pathname before each test.
  beforeEach(() => {
    mockPathname = "/";
  });

  test("should render the 'Te gjitha' (All) link", () => {
    render(<CategoryBar categories={testCategories} />);

    // "Te gjitha" is the "All categories" link that always appears.
    const allLink = screen.getByText("Te gjitha");
    expect(allLink).toBeInTheDocument();
  });

  test("'Te gjitha' link should point to '/'", () => {
    render(<CategoryBar categories={testCategories} />);

    const allLink = screen.getByText("Te gjitha");
    // closest("a") traverses up the DOM tree to find the nearest <a> ancestor.
    // This works because our mock Link renders an <a>.
    expect(allLink.closest("a")?.getAttribute("href")).toEqual("/");
  });

  test("should render all category names", () => {
    render(<CategoryBar categories={testCategories} />);

    // Each category name should appear as a link label.
    expect(screen.getByText("Politika")).toBeInTheDocument();
    expect(screen.getByText("Sport")).toBeInTheDocument();
    expect(screen.getByText("Teknologji")).toBeInTheDocument();
  });

  test("each category link should point to /category/{slug}", () => {
    render(<CategoryBar categories={testCategories} />);

    // Find the "Politika" link and check its href.
    const politikaLink = screen.getByText("Politika").closest("a");
    expect(politikaLink?.getAttribute("href")).toEqual("/category/politika");

    const sportLink = screen.getByText("Sport").closest("a");
    expect(sportLink?.getAttribute("href")).toEqual("/category/sport");

    const techLink = screen.getByText("Teknologji").closest("a");
    expect(techLink?.getAttribute("href")).toEqual("/category/teknologji");
  });

  test("should render the correct number of links (categories + 'Te gjitha')", () => {
    render(<CategoryBar categories={testCategories} />);

    // getAllByRole("link") finds all <a> elements.
    // Should be 3 categories + 1 "Te gjitha" = 4 links.
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(testCategories.length + 1);
  });

  test("should apply active styling to 'Te gjitha' when on homepage", () => {
    mockPathname = "/";
    render(<CategoryBar categories={testCategories} />);

    const allLink = screen.getByText("Te gjitha");
    // When on the homepage, "Te gjitha" should have the active class.
    // toContain checks if the className string includes the expected class.
    expect(allLink.className).toContain("bg-gn-primary");
  });

  test("should apply active styling to the matching category on category pages", () => {
    // Simulate being on /category/sport.
    mockPathname = "/category/sport";
    render(<CategoryBar categories={testCategories} />);

    const sportLink = screen.getByText("Sport");
    // The "Sport" link should have the active class.
    expect(sportLink.className).toContain("bg-gn-primary");
  });

  test("should NOT apply active styling to non-matching categories", () => {
    mockPathname = "/category/sport";
    render(<CategoryBar categories={testCategories} />);

    const politikaLink = screen.getByText("Politika");
    // "Politika" should NOT have the active class when we're on /category/sport.
    expect(politikaLink.className).not.toContain("bg-gn-primary");
  });

  test("should render correctly with an empty categories array", () => {
    render(<CategoryBar categories={[]} />);

    // Even with no categories, "Te gjitha" should still render.
    expect(screen.getByText("Te gjitha")).toBeInTheDocument();

    // Only 1 link (the "Te gjitha" link).
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
  });
});
