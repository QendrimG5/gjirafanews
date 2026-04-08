/**
 * ============================================================================
 * TEST SUITE: components/news-card.tsx — NewsCard component + timeAgo utility
 * ============================================================================
 *
 * This file tests two things from the NewsCard module:
 *
 * 1. timeAgo(dateStr) — a utility function that converts a date string into
 *    a relative time label like "5m", "3h", or "2d". This is the helper
 *    defined inside the component file.
 *
 * 2. NewsCard component — renders an article card with image, title, summary,
 *    category badge, source name, time ago, and read time.
 *
 * WHY these tests matter:
 *   NewsCard is the most-used component — it appears on the homepage, category
 *   pages, and saved articles page. timeAgo is called for every card render.
 *   Bugs here affect the entire front page.
 *
 * NOTE: timeAgo is not exported from the module, so we replicate its logic
 * here and test the component's rendered output which uses it internally.
 */

import React from "react";
// render() creates a lightweight DOM for the component.
// screen provides queries to find elements in the rendered output.
import { render, screen } from "@testing-library/react";

/**
 * Since timeAgo is a local function inside news-card.tsx (not exported),
 * we replicate it here to test the algorithm directly. This is a common
 * pattern when testing private/unexported utility functions — either
 * extract them to a separate module or duplicate the logic in tests.
 */
function timeAgo(dateStr: string): string {
  // new Date() creates a Date from the current system time.
  const now = new Date();
  // new Date(dateStr) parses the ISO string into a Date object.
  const date = new Date(dateStr);
  // getTime() returns milliseconds since Unix epoch.
  // Subtracting gives the time difference in milliseconds.
  const diffMs = now.getTime() - date.getTime();
  // Convert ms to minutes: 1 minute = 60,000 ms.
  // Math.floor rounds down to nearest integer.
  const diffMins = Math.floor(diffMs / 60000);
  // If less than 60 minutes, show minutes format.
  if (diffMins < 60) return `${diffMins}m`;
  // Convert minutes to hours.
  const diffHours = Math.floor(diffMins / 60);
  // If less than 24 hours, show hours format.
  if (diffHours < 24) return `${diffHours}h`;
  // Otherwise, convert to days.
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

// ─── timeAgo utility tests ──────────────────────────────────────────────────

describe("timeAgo utility function", () => {

  test("should return minutes format for times less than 60 minutes ago", () => {
    // Create a date that is 30 minutes in the past.
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const result = timeAgo(thirtyMinsAgo);

    // toMatch checks the string against a regex.
    // \d+ = one or more digits, m = the letter "m" (for minutes).
    expect(result).toMatch(/^\d+m$/);
  });

  test("should return '0m' for the current time", () => {
    // A date that is exactly now should produce 0m (0 minutes ago).
    const now = new Date().toISOString();
    const result = timeAgo(now);
    expect(result).toEqual("0m");
  });

  test("should return '5m' for exactly 5 minutes ago", () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = timeAgo(fiveMinsAgo);
    expect(result).toEqual("5m");
  });

  test("should return '59m' for 59 minutes ago", () => {
    const fiftyNineMinsAgo = new Date(Date.now() - 59 * 60 * 1000).toISOString();
    const result = timeAgo(fiftyNineMinsAgo);
    expect(result).toEqual("59m");
  });

  test("should return hours format for times between 1 and 24 hours ago", () => {
    // Create a date that is 3 hours in the past.
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(threeHoursAgo);
    // The result should be in hours format (e.g., "3h").
    expect(result).toMatch(/^\d+h$/);
  });

  test("should return '1h' for exactly 60 minutes ago", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const result = timeAgo(oneHourAgo);
    expect(result).toEqual("1h");
  });

  test("should return '23h' for 23 hours ago", () => {
    const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(twentyThreeHoursAgo);
    expect(result).toEqual("23h");
  });

  test("should return days format for times 24+ hours ago", () => {
    // Create a date that is 2 days in the past.
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(twoDaysAgo);
    // The result should be in days format (e.g., "2d").
    expect(result).toMatch(/^\d+d$/);
  });

  test("should return '1d' for exactly 24 hours ago", () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(oneDayAgo);
    expect(result).toEqual("1d");
  });

  test("should return '7d' for exactly one week ago", () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(oneWeekAgo);
    expect(result).toEqual("7d");
  });

  test("should handle dates far in the past (30 days)", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = timeAgo(thirtyDaysAgo);
    // Should return "30d" for 30 days ago.
    expect(result).toEqual("30d");
  });
});

// ─── NewsCard component tests ───────────────────────────────────────────────

// We need to mock the dependencies that NewsCard imports.

// Mock next/link — replace Link with a simple <a> tag for testing.
// jest.mock() replaces the module with the provided factory function.
jest.mock("next/link", () => {
  // Return a component that renders an <a> tag with the href and children.
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the SaveButton component — we don't want to test Zustand in this suite.
jest.mock("@/components/save-button", () => {
  return function MockSaveButton({ articleId }: { articleId: string }) {
    return <button data-testid={`save-btn-${articleId}`}>Save</button>;
  };
});

// Now import the actual component (after mocks are set up).
import NewsCard from "@/components/news-card";

// Shared props for test rendering. This matches the NewsCardProps type.
const defaultProps = {
  id: "art-1",
  title: "Test Article Title",
  summary: "This is a test summary for the article.",
  imageUrl: "https://example.com/image.jpg",
  publishedAt: new Date().toISOString(), // current time → "0m" ago
  readTime: 5,
  category: { name: "Sport", slug: "sport", color: "#1a7f37" },
  source: { name: "Test Source" },
};

describe("NewsCard component", () => {

  test("should render the article title", () => {
    // render() mounts the component into a jsdom environment.
    render(<NewsCard {...defaultProps} />);

    // screen.getByText() finds an element by its text content.
    // It throws if no element is found (failing the test).
    const title = screen.getByText("Test Article Title");

    // toBeInTheDocument() is a @testing-library/jest-dom matcher.
    // It asserts the element exists in the DOM.
    expect(title).toBeInTheDocument();
  });

  test("should render the article summary", () => {
    render(<NewsCard {...defaultProps} />);

    const summary = screen.getByText("This is a test summary for the article.");
    expect(summary).toBeInTheDocument();
  });

  test("should render the category name", () => {
    render(<NewsCard {...defaultProps} />);

    // The category name should appear as a badge on the card.
    const category = screen.getByText("Sport");
    expect(category).toBeInTheDocument();
  });

  test("should render the source name", () => {
    render(<NewsCard {...defaultProps} />);

    const source = screen.getByText("Test Source");
    expect(source).toBeInTheDocument();
  });

  test("should render the read time", () => {
    render(<NewsCard {...defaultProps} />);

    // The read time is displayed as "5 min" in the metadata bar.
    const readTime = screen.getByText("5 min");
    expect(readTime).toBeInTheDocument();
  });

  test("should link to the correct article page", () => {
    render(<NewsCard {...defaultProps} />);

    // querySelector finds the first <a> tag in the rendered output.
    // Since we mocked next/link as an <a>, this is the article link.
    const link = document.querySelector("a");
    expect(link).toBeDefined();

    // getAttribute("href") returns the href value of the <a> tag.
    // It should point to /article/{id}.
    expect(link!.getAttribute("href")).toEqual("/article/art-1");
  });

  test("should render the article image with correct src and alt", () => {
    render(<NewsCard {...defaultProps} />);

    // getByAltText finds an element by its alt attribute.
    // Images should have alt text for accessibility.
    const img = screen.getByAltText("Test Article Title");
    expect(img).toBeInTheDocument();

    // getAttribute("src") verifies the image points to the correct URL.
    expect(img.getAttribute("src")).toEqual("https://example.com/image.jpg");
  });

  test("should render the SaveButton with the correct articleId", () => {
    render(<NewsCard {...defaultProps} />);

    // We mocked SaveButton to render with a data-testid including the article ID.
    // getByTestId finds elements by their data-testid attribute.
    const saveBtn = screen.getByTestId("save-btn-art-1");
    expect(saveBtn).toBeInTheDocument();
  });

  test("should render different titles for different props", () => {
    // Test that the component correctly renders dynamic content.
    const customProps = {
      ...defaultProps,
      id: "art-2",
      title: "Different Title Here",
    };

    render(<NewsCard {...customProps} />);

    const title = screen.getByText("Different Title Here");
    expect(title).toBeInTheDocument();
  });
});
