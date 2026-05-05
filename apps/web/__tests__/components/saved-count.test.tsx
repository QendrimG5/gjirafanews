/**
 * ============================================================================
 * TEST SUITE: components/saved-count.tsx — SavedCount badge component
 * ============================================================================
 *
 * This file tests the SavedCount component which:
 *   - Renders a bookmark icon link to /saved
 *   - Shows a count badge when there are saved articles (count > 0)
 *   - Hides the badge when there are no saved articles
 *   - Reads the count from useSavedArticles Zustand store
 *   - Sets an aria-label with the count for accessibility
 *
 * WHY these tests matter:
 *   SavedCount appears in the Navbar. If the badge doesn't hide when count
 *   is 0, users see a confusing "0" badge. If the link is wrong, users can't
 *   reach their saved articles. The aria-label is critical for screen readers.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// ─── Mock the Zustand store ────────────────────────────────────────────────
// We mock the store so we can control savedIds without Zustand persist hydration.
let mockSavedIds: string[] = [];

jest.mock("@/lib/store/saved-articles", () => ({
  // useSavedArticles with a selector: the component calls useSavedArticles((s) => s.savedIds.length)
  // When called with a selector function, we invoke it with our mock state.
  useSavedArticles: (selector?: (state: { savedIds: string[] }) => unknown) => {
    const state = { savedIds: mockSavedIds };
    return selector ? selector(state) : state;
  },
}));

// Mock next/link — replace with <a> for testing.
jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Import component after mocks.
import SavedCount from "@/components/saved-count";

describe("SavedCount component", () => {
  // Reset mock state before each test.
  beforeEach(() => {
    mockSavedIds = [];
  });

  test("should render a link element", () => {
    render(<SavedCount />);

    // getByRole("link") finds the <a> element (rendered from our mock Link).
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  test("should link to /saved", () => {
    render(<SavedCount />);

    const link = screen.getByRole("link");
    // getAttribute("href") returns the link's target URL.
    expect(link.getAttribute("href")).toEqual("/saved");
  });

  test("should show correct aria-label with 0 saved articles", () => {
    render(<SavedCount />);

    // The aria-label includes the count for screen readers.
    // getByLabelText checks the aria-label attribute.
    const link = screen.getByLabelText("0 artikuj te ruajtur");
    expect(link).toBeInTheDocument();
  });

  test("should NOT show count badge when savedIds is empty", () => {
    render(<SavedCount />);

    // queryByText returns null if the element is not found (doesn't throw).
    // We use it here because we expect the badge NOT to exist.
    const badge = screen.queryByText("0");
    // toBeNull() asserts queryByText returned null → element doesn't exist.
    expect(badge).toBeNull();
  });

  test("should show count badge when there are saved articles", () => {
    // Set 3 saved articles in the store.
    mockSavedIds = ["art-1", "art-2", "art-3"];

    render(<SavedCount />);

    // The badge should display "3".
    const badge = screen.getByText("3");
    expect(badge).toBeInTheDocument();
  });

  test("should show correct aria-label with multiple saved articles", () => {
    mockSavedIds = ["art-1", "art-2"];

    render(<SavedCount />);

    // "2 artikuj te ruajtur" = "2 saved articles" in Albanian.
    const link = screen.getByLabelText("2 artikuj te ruajtur");
    expect(link).toBeInTheDocument();
  });

  test("should update badge when store changes", () => {
    // Start with 1 saved article.
    mockSavedIds = ["art-1"];
    const { rerender } = render(<SavedCount />);

    // Badge should show "1".
    expect(screen.getByText("1")).toBeInTheDocument();

    // Add another saved article.
    mockSavedIds = ["art-1", "art-2"];
    // rerender triggers a re-render of the same component.
    rerender(<SavedCount />);

    // Badge should now show "2".
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("should render an SVG bookmark icon", () => {
    render(<SavedCount />);

    const link = screen.getByRole("link");
    // querySelector finds the SVG inside the link.
    const svg = link.querySelector("svg");
    expect(svg).not.toBeNull();
  });
});
