/**
 * ============================================================================
 * TEST SUITE: components/navbar.tsx — Navbar top navigation component
 * ============================================================================
 *
 * This file tests the Navbar component which:
 *   - Renders the GjirafaNews brand logo link to "/"
 *   - Shows a "Temat" (Topics) navigation link to "/topics"
 *   - Includes the SavedCount component
 *   - Includes the AuthNavLink component
 *   - Is sticky at the top of the viewport
 *
 * WHY these tests matter:
 *   The Navbar is the primary navigation for all public pages. It's rendered
 *   in the root layout so every page depends on it. Broken links here mean
 *   users can't navigate the entire site.
 */

import React from "react";
import { render, screen } from "@testing-library/react";

// Mock next/link — replace with <a> for testing.
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

// Mock child components to isolate Navbar's own rendering logic.
// We don't want SavedCount's Zustand store or AuthNavLink's TanStack Query
// to interfere with these unit tests.

jest.mock("@/components/saved-count", () => {
  // Return a simple placeholder component with a test ID.
  return function MockSavedCount() {
    return <div data-testid="saved-count">SavedCount</div>;
  };
});

jest.mock("@/components/auth-nav-link", () => {
  return function MockAuthNavLink() {
    return <div data-testid="auth-nav-link">AuthNavLink</div>;
  };
});

jest.mock("@/components/notifications-nav-link", () => {
  return function MockNotificationsNavLink() {
    return <div data-testid="notifications-nav-link">NotificationsNavLink</div>;
  };
});

// Import Navbar after all mocks are in place.
import Navbar from "@/components/navbar";

describe("Navbar component", () => {
  test("should render the brand name 'GjirafaNews'", () => {
    render(<Navbar />);

    // The brand consists of "Gjirafa" + "News" in separate spans.
    // getByText with a function checks if any element contains the text.
    const gjirafa = screen.getByText("Gjirafa");
    expect(gjirafa).toBeInTheDocument();

    const news = screen.getByText("News");
    expect(news).toBeInTheDocument();
  });

  test("should render the 'G' logo", () => {
    render(<Navbar />);

    // The logo is a single "G" letter inside a rounded square.
    const logo = screen.getByText("G");
    expect(logo).toBeInTheDocument();
  });

  test("brand logo should link to homepage '/'", () => {
    render(<Navbar />);

    // Find the link that contains the brand name.
    // getAllByRole("link") gets all <a> elements.
    const links = screen.getAllByRole("link");

    // The first link should be the brand link pointing to "/".
    const brandLink = links.find((link) => link.getAttribute("href") === "/");
    expect(brandLink).toBeDefined();
  });

  test("should render the 'Temat' (Topics) navigation link", () => {
    render(<Navbar />);

    // "Temat" = Albanian for "Topics"
    const tematLink = screen.getByText("Temat");
    expect(tematLink).toBeInTheDocument();
  });

  test("'Temat' link should point to '/topics'", () => {
    render(<Navbar />);

    const tematLink = screen.getByText("Temat");
    // closest("a") finds the parent <a> element.
    const anchor = tematLink.closest("a");
    expect(anchor?.getAttribute("href")).toEqual("/topics");
  });

  test("should render the SavedCount component", () => {
    render(<Navbar />);

    // Our mock SavedCount has data-testid="saved-count".
    // getByTestId finds elements by data-testid attribute.
    const savedCount = screen.getByTestId("saved-count");
    expect(savedCount).toBeInTheDocument();
  });

  test("should render the AuthNavLink component", () => {
    render(<Navbar />);

    // Our mock AuthNavLink has data-testid="auth-nav-link".
    const authNavLink = screen.getByTestId("auth-nav-link");
    expect(authNavLink).toBeInTheDocument();
  });

  test("should render a <header> element", () => {
    render(<Navbar />);

    // querySelector finds the first <header> in the rendered output.
    // The Navbar's root element is a <header> tag.
    const header = document.querySelector("header");
    expect(header).not.toBeNull();
  });
});
